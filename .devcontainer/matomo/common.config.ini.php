; <?php exit; ?> DO NOT REMOVE THIS LINE
; Local development only; merged below the config.ini.php the installer writes.
[General]
; Matomo is reached as localhost:8091 from the browser and as http://matomo
; from the setup container.
enable_trusted_host_check = 0

[Tracker]
; Required for the DEZ tracker: a visit is the tab session sent as _id.
; By default Matomo merges everyone with the same IP and browser into one visit.
trust_visitors_cookies = 1
