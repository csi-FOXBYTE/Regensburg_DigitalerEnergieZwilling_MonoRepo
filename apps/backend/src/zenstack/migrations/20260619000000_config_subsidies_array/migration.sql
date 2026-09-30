ALTER TABLE "Config"
ALTER COLUMN "subsidies" TYPE TEXT[]
USING CASE
  WHEN btrim("subsidies") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["subsidies"]
END;
