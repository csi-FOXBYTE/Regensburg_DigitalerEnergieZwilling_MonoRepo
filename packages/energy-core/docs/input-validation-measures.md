# Remaining Input Validation Measures

The numbers below refer to the corresponding rows in
[`input-validation-contradictions.md`](./input-validation-contradictions.md).

## Frontend

1. **Building base area must be positive (#4):** Enforce
   `general.buildingBaseArea > 0`.
2. **Electricity bill costs must be consistent (#5):** Enforce
   `baseCost <= totalCost` before deriving electricity consumption.
3. **Roof-window area must fit within the roof (#11):** Enforce
   `roofWindows.area <= roof.area`.
4. **Carrier requirements (#15):** Filter primary-energy-carrier options based
   on gas and storage availability.
5. **Renovation chronology (#21):** Enforce that component and heating-system
   years cannot predate `general.buildingYear`.
6. **Roof area must cover the top floor:** Enforce
   `roof.area >= topFloor.area`.

The electricity bill relationship from **#5** cannot currently be checked by
the frontend or core input validator: `DETInput` and the current frontend form
contain electricity consumption, unit rate, and base rate, but not the total
electricity bill cost. The input model and form must be extended before this
relationship can be enforced.
