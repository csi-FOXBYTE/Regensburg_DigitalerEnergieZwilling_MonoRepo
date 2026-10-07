"""Format nonstandard scanner identifiers without resolving policy findings."""
import hashlib
import json
import re
import sys
from license_expression import get_spdx_licensing

symbols = {key.lower(): value for key, value in get_spdx_licensing().known_symbols.items()}
tokens = re.compile(r"[A-Za-z0-9.+:-]+")

for filename in sys.argv[1:]:
    with open(filename, encoding="utf-8") as stream:
        document = json.load(stream)
    extracted = {entry["licenseId"]: entry for entry in document.get("hasExtractedLicensingInfos", [])}

    def reference(label):
        identifier = label if label.startswith("LicenseRef-") else "LicenseRef-detected-" + hashlib.sha256(label.encode()).hexdigest()[:24]
        if identifier not in extracted:
            extracted[identifier] = {"licenseId": identifier, "name": label, "extractedText": "NOASSERTION",
                                    "comment": "Original identifier retained; matched texts are separately included in this document and scan evidence."}
        return identifier

    def expression(value):
        if value in ("NONE", "NOASSERTION"):
            return value
        previous = None
        unknown_exception = False

        def replace(match):
            nonlocal previous, unknown_exception
            token = match.group()
            if token in ("AND", "OR", "WITH"):
                previous = token
                return token
            symbol = symbols.get(token.lower())
            exception = previous == "WITH"
            previous = token
            if symbol is not None and symbol.is_exception == exception:
                return symbol.key
            if exception:
                unknown_exception = True
            return reference(token)

        normalized = tokens.sub(replace, value)
        return reference(value) if unknown_exception else normalized

    for package in document.get("packages", []):
        for field in ("licenseDeclared", "licenseConcluded"):
            package[field] = expression(package[field])
        if "licenseInfoFromFiles" in package:
            package["licenseInfoFromFiles"] = sorted(set(map(expression, package["licenseInfoFromFiles"])))
    for file in document.get("files", []):
        file["licenseConcluded"] = expression(file["licenseConcluded"])
        file["licenseInfoInFiles"] = sorted(set(map(expression, file["licenseInfoInFiles"])))
    document["hasExtractedLicensingInfos"] = [extracted[key] for key in sorted(extracted)]
    with open(filename, "w", encoding="utf-8") as stream:
        json.dump(document, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
