import { mapConfig } from '@/config/map';
import * as Cesium from 'cesium';
import {
  type CameraActivity,
  type CameraIntent,
  type CameraMode,
  type CameraTarget,
  type FocusCameraIntent,
  type PanDirection,
  setCameraHeading,
  setCameraStatus,
  setCameraTarget,
} from './camera-state';

const INITIAL_DESTINATION = Cesium.Cartesian3.fromDegrees(
  mapConfig.initialView.longitudeDegrees,
  mapConfig.initialView.latitudeDegrees,
  mapConfig.initialView.heightMeters,
);
const INITIAL_ORIENTATION = new Cesium.HeadingPitchRoll(
  Cesium.Math.toRadians(mapConfig.initialView.headingDegrees),
  Cesium.Math.toRadians(mapConfig.initialView.pitchDegrees),
  Cesium.Math.toRadians(mapConfig.initialView.rollDegrees),
);

const PERSPECTIVE_FOCUS_PITCH = Cesium.Math.toRadians(-40);
const TOP_DOWN_PITCH = -Cesium.Math.PI_OVER_TWO;
const FOCUS_RANGE = 300;
const PERSPECTIVE_FLIGHT_ASPECT_RATIO = 5;
const FOCUS_FLIGHT_INITIAL_SPEED = 350;
const FOCUS_FLIGHT_MIN_DURATION = 0.35;
const FOCUS_FLIGHT_MAX_DURATION = 1.5;
const PAN_FACTOR = 0.5;
const PAN_DURATION = 0.3;
const ZOOM_FACTOR = 0.3;
const ZOOM_DURATION = 0.3;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const WHEEL_INTERACTION_END_DELAY = 120;
const ALIGN_NORTH_DURATION = 0.6;
const MODE_TRANSITION_DURATION = 0.45;
const MOBILE_BREAKPOINT = 768;
const MOBILE_VERTICAL_OFFSET_RATIO = 0.15;
const CAMERA_NEAR_PLANE = 1;

type CameraControllerOptions = {
  onFocusComplete?: (intent: FocusCameraIntent) => void;
};

function isFiniteTarget(target: CameraTarget): boolean {
  return (
    Number.isFinite(target.longitudeDegrees) &&
    Number.isFinite(target.latitudeDegrees) &&
    target.longitudeDegrees >= -180 &&
    target.longitudeDegrees <= 180 &&
    target.latitudeDegrees >= -90 &&
    target.latitudeDegrees <= 90
  );
}

export class CameraController {
  private readonly viewer: Cesium.Viewer;

  private readonly onFocusComplete?: (intent: FocusCameraIntent) => void;
  private mode: CameraMode = 'perspective';
  private activity: CameraActivity = 'idle';
  private activeOperation = 0;
  private activeIntent: CameraIntent | null = null;
  private disposed = false;
  private removeMoveStartListener: (() => void) | undefined;
  private removeMoveEndListener: (() => void) | undefined;
  private removePostRenderListener: (() => void) | undefined;
  private inputHandler: Cesium.ScreenSpaceEventHandler | undefined;
  private wheelInteractionEndTimer: number | undefined;
  private cancelFocusFlight: (() => void) | undefined;
  private cancelZoomFlight: (() => void) | undefined;

  constructor(viewer: Cesium.Viewer, options: CameraControllerOptions = {}) {
    this.viewer = viewer;
    this.onFocusComplete = options.onFocusComplete;
    this.initializeCamera();
  }

  activate() {
    if (this.disposed) return;
    setCameraStatus({
      initialized: true,
      mode: this.mode,
      activity: this.activity,
    });
  }

  dispose(): CameraIntent | null {
    if (this.disposed) return null;
    const interruptedIntent = this.activeIntent;
    this.disposed = true;
    this.activeOperation++;
    this.cancelFocusFlight?.();
    this.cancelZoomFlight?.();
    this.viewer.camera.cancelFlight();
    if (this.wheelInteractionEndTimer !== undefined) {
      window.clearTimeout(this.wheelInteractionEndTimer);
    }
    this.inputHandler?.destroy();
    this.removeMoveStartListener?.();
    this.removeMoveEndListener?.();
    this.removePostRenderListener?.();
    return interruptedIntent;
  }

  execute(intent: CameraIntent): boolean {
    if (this.disposed || this.activity !== 'idle') return false;

    switch (intent.type) {
      case 'focus':
        return this.focus(intent);
      case 'pan':
        return this.pan(intent.direction);
      case 'zoom':
        return this.zoom(intent.direction);
      case 'alignNorth':
        return this.alignNorth();
      case 'setMode':
        return this.setMode(intent.mode);
      case 'resetTransform':
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        this.viewer.scene.requestRender();
        this.captureTarget();
        return true;
    }
  }

  private initializeCamera() {
    const { camera, scene } = this.viewer;
    const inputController = scene.screenSpaceCameraController;

    camera.setView({
      destination: INITIAL_DESTINATION,
      orientation: INITIAL_ORIENTATION,
    });
    camera.frustum.near = CAMERA_NEAR_PLANE;

    inputController.zoomFactor = 3;
    this.applyModeInputPolicy();
    this.captureTarget();

    this.inputHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    this.inputHandler.setInputAction(
      (delta: number) => this.handleTopDownWheel(delta),
      Cesium.ScreenSpaceEventType.WHEEL,
    );

    this.removeMoveStartListener = camera.moveStart.addEventListener(() => {
      if (this.disposed || this.activity !== 'idle') return;
      this.setActivity('interaction');
    });
    this.removeMoveEndListener = camera.moveEnd.addEventListener(() => {
      if (this.disposed || this.activity !== 'interaction') return;
      this.captureTarget();
      this.setActivity('idle');
    });
    this.removePostRenderListener =
      this.viewer.scene.postRender.addEventListener(() => {
        if (this.disposed) return;
        setCameraHeading(Cesium.Math.toDegrees(camera.heading));
      });
  }

  private setActivity(activity: CameraActivity) {
    this.activity = activity;
    setCameraStatus({
      initialized: true,
      mode: this.mode,
      activity,
    });
  }

  private applyModeInputPolicy() {
    const inputController = this.viewer.scene.screenSpaceCameraController;
    const allowTilt = this.mode === 'perspective';
    inputController.enableTilt = allowTilt;
    inputController.enableLook = allowTilt;
    inputController.zoomEventTypes =
      this.mode === 'topDown'
        ? [Cesium.CameraEventType.PINCH]
        : [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
  }

  private handleTopDownWheel(delta: number) {
    const { camera, scene } = this.viewer;
    const inputController = scene.screenSpaceCameraController;
    const frustum = camera.frustum;

    if (
      this.disposed ||
      this.mode !== 'topDown' ||
      (this.activity !== 'idle' && this.activity !== 'interaction') ||
      !(frustum instanceof Cesium.OrthographicFrustum)
    ) {
      return;
    }
    const currentWidth = frustum.width;
    if (currentWidth === undefined) return;

    if (this.activity === 'idle') {
      this.setActivity('interaction');
    }

    const widthFactor = Math.exp(
      -Cesium.Math.clamp(delta, -240, 240) * WHEEL_ZOOM_SENSITIVITY,
    );
    frustum.width = Cesium.Math.clamp(
      currentWidth * widthFactor,
      inputController.minimumZoomDistance,
      inputController.maximumZoomDistance,
    );
    scene.requestRender();

    if (this.wheelInteractionEndTimer !== undefined) {
      window.clearTimeout(this.wheelInteractionEndTimer);
    }
    this.wheelInteractionEndTimer = window.setTimeout(() => {
      this.wheelInteractionEndTimer = undefined;
      if (this.disposed || this.activity !== 'interaction') return;
      this.captureTarget();
      this.setActivity('idle');
    }, WHEEL_INTERACTION_END_DELAY);
  }

  private captureTarget() {
    const { camera, scene } = this.viewer;
    const canvas = scene.canvas;
    const center = new Cesium.Cartesian2(
      canvas.clientWidth / 2,
      canvas.clientHeight / 2,
    );
    const ray = camera.getPickRay(center);
    if (!ray) return;

    const position =
      scene.globe.pick(ray, scene) ??
      camera.pickEllipsoid(center, scene.globe.ellipsoid);
    if (!position) return;

    const cartographic = Cesium.Cartographic.fromCartesian(position);
    setCameraTarget({
      longitudeDegrees: Cesium.Math.toDegrees(cartographic.longitude),
      latitudeDegrees: Cesium.Math.toDegrees(cartographic.latitude),
    });
  }

  private getCenterAndRange():
    | { center: Cesium.Cartesian3; range: number }
    | undefined {
    const { camera, scene } = this.viewer;
    const canvas = scene.canvas;
    const windowPosition = new Cesium.Cartesian2(
      canvas.clientWidth / 2,
      canvas.clientHeight / 2,
    );
    const ray = camera.getPickRay(windowPosition);
    if (!ray) return;

    const center =
      scene.globe.pick(ray, scene) ??
      camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
    if (!center) return;

    return {
      center,
      range: Cesium.Cartesian3.distance(camera.position, center),
    };
  }

  private startFlight(
    intent: CameraIntent,
    activity: Extract<CameraActivity, 'flight' | 'modeTransition'>,
    start: (complete: () => void, cancel: () => void) => void,
    completeAction?: () => void,
  ): boolean {
    const operation = ++this.activeOperation;
    this.activeIntent = intent;
    this.setActivity(activity);

    const finish = (completed: boolean) => {
      if (this.disposed || operation !== this.activeOperation) return;
      this.activeIntent = null;
      this.captureTarget();
      this.setActivity('idle');
      if (completed) completeAction?.();
    };

    try {
      start(
        () => finish(true),
        () => finish(false),
      );
      return true;
    } catch (error) {
      finish(false);
      throw error;
    }
  }

  private focus(intent: FocusCameraIntent): boolean {
    if (!isFiniteTarget(intent.target)) return false;

    const { camera, scene } = this.viewer;
    const cartographic = Cesium.Cartographic.fromDegrees(
      intent.target.longitudeDegrees,
      intent.target.latitudeDegrees,
    );
    const groundHeight = scene.globe.getHeight(cartographic) ?? 350;
    const position = Cesium.Cartesian3.fromDegrees(
      intent.target.longitudeDegrees,
      intent.target.latitudeDegrees,
      groundHeight,
    );
    const isPerspective = this.mode === 'perspective';
    const heading = isPerspective ? camera.heading : 0;
    const pitch =
      this.mode === 'topDown' ? TOP_DOWN_PITCH : PERSPECTIVE_FOCUS_PITCH;
    const flyTarget =
      intent.accommodateMobileOverlay && window.innerWidth < MOBILE_BREAKPOINT
        ? this.offsetTargetForMobileOverlay(
            position,
            heading,
            pitch,
            FOCUS_RANGE,
          )
        : position;

    return this.startFlight(
      intent,
      'flight',
      (complete, cancel) => {
        this.flyFocusCurve(
          flyTarget,
          heading,
          pitch,
          isPerspective,
          complete,
          cancel,
        );
      },
      () => this.onFocusComplete?.(intent),
    );
  }

  private flyFocusCurve(
    target: Cesium.Cartesian3,
    heading: number,
    pitch: number,
    isPerspective: boolean,
    complete: () => void,
    cancel: () => void,
  ) {
    const { camera, scene } = this.viewer;
    const ellipsoid = scene.globe.ellipsoid;
    const start = Cesium.Cartographic.clone(camera.positionCartographic);
    const end = Cesium.Cartographic.fromCartesian(
      this.getFocusCameraPosition(target, heading, pitch),
      ellipsoid,
    );
    const geodesic = new Cesium.EllipsoidGeodesic(start, end, ellipsoid);
    const lateralDistance = geodesic.surfaceDistance;
    const maximumLift = isPerspective
      ? lateralDistance / PERSPECTIVE_FLIGHT_ASPECT_RATIO
      : 0;
    const normalizedDistance = lateralDistance / FOCUS_FLIGHT_INITIAL_SPEED;
    const durationRange = FOCUS_FLIGHT_MAX_DURATION - FOCUS_FLIGHT_MIN_DURATION;
    const duration =
      FOCUS_FLIGHT_MIN_DURATION +
      durationRange * (1 - Math.exp(-normalizedDistance / durationRange));
    const startHeading = isPerspective ? camera.heading : heading;
    const headingDelta = Cesium.Math.negativePiToPi(heading - startHeading);
    const startPitch = isPerspective ? camera.pitch : pitch;
    const startRoll = isPerspective ? camera.roll : 0;
    const rollDelta = Cesium.Math.negativePiToPi(-startRoll);
    const inputController = scene.screenSpaceCameraController;
    const inputsWereEnabled = inputController.enableInputs;
    const orthographicWidth =
      !isPerspective && camera.frustum instanceof Cesium.OrthographicFrustum
        ? camera.frustum.width
        : undefined;

    if (duration <= Cesium.Math.EPSILON6) {
      camera.setView({
        destination: Cesium.Cartesian3.fromRadians(
          end.longitude,
          end.latitude,
          end.height,
          ellipsoid,
        ),
        orientation: { heading, pitch, roll: 0 },
      });
      if (
        orthographicWidth !== undefined &&
        camera.frustum instanceof Cesium.OrthographicFrustum
      ) {
        camera.frustum.width = orthographicWidth;
      }
      scene.requestRender();
      complete();
      return;
    }

    inputController.enableInputs = false;
    const startTime = performance.now();
    let animationFrame: number | undefined;
    let finished = false;

    const finish = (completed: boolean) => {
      if (finished) return;
      finished = true;
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
      this.cancelFocusFlight = undefined;
      inputController.enableInputs = inputsWereEnabled;
      if (completed) complete();
      else cancel();
    };

    const update = (timestamp: number) => {
      const elapsedSeconds = (timestamp - startTime) / 1000;
      const linearProgress = Cesium.Math.clamp(elapsedSeconds / duration, 0, 1);
      const progress = 0.5 - 0.5 * Math.cos(Math.PI * linearProgress);
      const point = geodesic.interpolateUsingFraction(progress);
      const baseHeight = Cesium.Math.lerp(start.height, end.height, progress);
      const arcHeight = 4 * maximumLift * progress * (1 - progress);

      camera.setView({
        destination: Cesium.Cartesian3.fromRadians(
          point.longitude,
          point.latitude,
          baseHeight + arcHeight,
          ellipsoid,
        ),
        orientation: {
          heading: startHeading + headingDelta * progress,
          pitch: Cesium.Math.lerp(startPitch, pitch, progress),
          roll: startRoll + rollDelta * progress,
        },
      });
      if (
        orthographicWidth !== undefined &&
        camera.frustum instanceof Cesium.OrthographicFrustum
      ) {
        camera.frustum.width = orthographicWidth;
      }
      scene.requestRender();

      if (linearProgress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        finish(true);
      }
    };

    this.cancelFocusFlight = () => finish(false);
    animationFrame = requestAnimationFrame(update);
  }

  private getFocusCameraPosition(
    target: Cesium.Cartesian3,
    heading: number,
    pitch: number,
  ): Cesium.Cartesian3 {
    const cosPitch = Math.cos(pitch);
    const offset = new Cesium.Cartesian3(
      -Math.sin(heading) * cosPitch * FOCUS_RANGE,
      -Math.cos(heading) * cosPitch * FOCUS_RANGE,
      -Math.sin(pitch) * FOCUS_RANGE,
    );
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(target);
    return Cesium.Matrix4.multiplyByPoint(
      transform,
      offset,
      new Cesium.Cartesian3(),
    );
  }

  private offsetTargetForMobileOverlay(
    position: Cesium.Cartesian3,
    heading: number,
    pitch: number,
    range: number,
  ): Cesium.Cartesian3 {
    const { camera, scene } = this.viewer;
    let visibleHeight: number;

    if (camera.frustum instanceof Cesium.OrthographicFrustum) {
      const aspectRatio =
        camera.frustum.aspectRatio ??
        scene.drawingBufferWidth / scene.drawingBufferHeight;
      visibleHeight = range / aspectRatio;
    } else if (camera.frustum instanceof Cesium.PerspectiveFrustum) {
      const verticalFov = camera.frustum.fovy ?? Cesium.Math.toRadians(60);
      visibleHeight = 2 * range * Math.tan(verticalFov / 2);
    } else {
      visibleHeight = range;
    }

    const worldShift = MOBILE_VERTICAL_OFFSET_RATIO * visibleHeight;
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    const shiftEnu = new Cesium.Cartesian4(
      Math.sin(heading) * sinPitch * worldShift,
      Math.cos(heading) * sinPitch * worldShift,
      -cosPitch * worldShift,
      0,
    );
    const shiftEcef = Cesium.Matrix4.multiplyByVector(
      enuToEcef,
      shiftEnu,
      new Cesium.Cartesian4(),
    );

    return Cesium.Cartesian3.add(
      position,
      new Cesium.Cartesian3(shiftEcef.x, shiftEcef.y, shiftEcef.z),
      new Cesium.Cartesian3(),
    );
  }

  private pan(direction: PanDirection): boolean {
    const { camera } = this.viewer;
    const ellipsoid = this.viewer.scene.globe.ellipsoid;
    const surfaceNormal = ellipsoid.geodeticSurfaceNormal(
      camera.position,
      new Cesium.Cartesian3(),
    );
    const forward = Cesium.Cartesian3.cross(
      camera.right,
      surfaceNormal,
      new Cesium.Cartesian3(),
    );
    Cesium.Cartesian3.normalize(forward, forward);
    const right = Cesium.Cartesian3.cross(
      surfaceNormal,
      forward,
      new Cesium.Cartesian3(),
    );
    Cesium.Cartesian3.normalize(right, right);

    const isForwardBack = direction === 'up' || direction === 'down';
    const axis = isForwardBack ? forward : right;
    const sign = direction === 'down' || direction === 'right' ? 1 : -1;
    const panAmount = camera.positionCartographic.height * PAN_FACTOR;
    const destination = Cesium.Cartesian3.add(
      camera.position,
      Cesium.Cartesian3.multiplyByScalar(
        axis,
        sign * panAmount,
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );

    return this.startFlight(
      { type: 'pan', direction },
      'flight',
      (complete, cancel) => {
        camera.flyTo({
          destination,
          orientation: {
            heading: camera.heading,
            pitch: this.mode === 'topDown' ? TOP_DOWN_PITCH : camera.pitch,
            roll: 0,
          },
          duration: PAN_DURATION,
          complete,
          cancel,
        });
      },
    );
  }

  private zoom(direction: 'in' | 'out'): boolean {
    const { camera } = this.viewer;
    const frustum = camera.frustum;

    if (
      this.mode === 'topDown' &&
      frustum instanceof Cesium.OrthographicFrustum
    ) {
      return this.startFlight(
        { type: 'zoom', direction },
        'flight',
        (complete, cancel) => {
          this.zoomTopDown(frustum, direction, complete, cancel);
        },
      );
    }

    const height = camera.positionCartographic.height;
    const amount =
      direction === 'in' ? height * ZOOM_FACTOR : -height * ZOOM_FACTOR;
    const destination = Cesium.Cartesian3.add(
      camera.position,
      Cesium.Cartesian3.multiplyByScalar(
        camera.direction,
        amount,
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );

    return this.startFlight(
      { type: 'zoom', direction },
      'flight',
      (complete, cancel) => {
        camera.flyTo({
          destination,
          orientation: {
            heading: camera.heading,
            pitch: this.mode === 'topDown' ? TOP_DOWN_PITCH : camera.pitch,
            roll: 0,
          },
          duration: ZOOM_DURATION,
          complete,
          cancel,
        });
      },
    );
  }

  private zoomTopDown(
    frustum: Cesium.OrthographicFrustum,
    direction: 'in' | 'out',
    complete: () => void,
    cancel: () => void,
  ) {
    const scene = this.viewer.scene;
    const inputController = scene.screenSpaceCameraController;
    const inputsWereEnabled = inputController.enableInputs;
    const startWidth = frustum.width;
    if (startWidth === undefined) {
      cancel();
      return;
    }
    const widthFactor = direction === 'in' ? 1 - ZOOM_FACTOR : 1 + ZOOM_FACTOR;
    const targetWidth = Cesium.Math.clamp(
      startWidth * widthFactor,
      inputController.minimumZoomDistance,
      inputController.maximumZoomDistance,
    );
    const startTime = performance.now();
    let animationFrame: number | undefined;
    let finished = false;

    inputController.enableInputs = false;

    const finish = (completed: boolean) => {
      if (finished) return;
      finished = true;
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
      this.cancelZoomFlight = undefined;
      inputController.enableInputs = inputsWereEnabled;
      if (completed) complete();
      else cancel();
    };

    const update = (timestamp: number) => {
      const elapsedSeconds = (timestamp - startTime) / 1000;
      const linearProgress = Cesium.Math.clamp(
        elapsedSeconds / ZOOM_DURATION,
        0,
        1,
      );
      const progress = 0.5 - 0.5 * Math.cos(Math.PI * linearProgress);

      frustum.width = Cesium.Math.lerp(startWidth, targetWidth, progress);
      scene.requestRender();

      if (linearProgress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        finish(true);
      }
    };

    this.cancelZoomFlight = () => finish(false);
    animationFrame = requestAnimationFrame(update);
  }

  private alignNorth(): boolean {
    const view = this.getCenterAndRange();
    if (!view) return false;

    const { camera } = this.viewer;
    const pitch = this.mode === 'topDown' ? TOP_DOWN_PITCH : camera.pitch;

    return this.startFlight(
      { type: 'alignNorth' },
      'flight',
      (complete, cancel) => {
        camera.flyToBoundingSphere(new Cesium.BoundingSphere(view.center, 0), {
          offset: new Cesium.HeadingPitchRange(0, pitch, view.range),
          duration: ALIGN_NORTH_DURATION,
          complete,
          cancel,
        });
      },
    );
  }

  private setMode(mode: CameraMode): boolean {
    if (mode === this.mode) return true;

    const view = this.getCenterAndRange();
    if (!view) return false;

    const { camera, scene } = this.viewer;
    this.mode = mode;
    this.applyModeInputPolicy();

    if (mode === 'topDown') {
      camera.switchToOrthographicFrustum();
    } else {
      camera.switchToPerspectiveFrustum();
    }
    camera.frustum.near = CAMERA_NEAR_PLANE;
    scene.requestRender();

    const pitch = mode === 'topDown' ? TOP_DOWN_PITCH : PERSPECTIVE_FOCUS_PITCH;
    const heading = mode === 'topDown' ? 0 : camera.heading;

    return this.startFlight(
      { type: 'setMode', mode },
      'modeTransition',
      (complete, cancel) => {
        camera.flyToBoundingSphere(new Cesium.BoundingSphere(view.center, 0), {
          offset: new Cesium.HeadingPitchRange(heading, pitch, view.range),
          duration: MODE_TRANSITION_DURATION,
          complete,
          cancel,
        });
      },
    );
  }
}
