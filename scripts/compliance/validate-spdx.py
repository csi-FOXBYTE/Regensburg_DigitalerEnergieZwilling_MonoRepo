"""Use the SPDX project's validator; malformed SBOMs must fail the gate."""
import sys
from spdx_tools.spdx.parser.parse_anything import parse_file
from spdx_tools.spdx.validation.document_validator import validate_full_spdx_document

failed = False
for filename in sys.argv[1:]:
    try:
        messages = validate_full_spdx_document(parse_file(filename))
        for message in messages:
            print(f"{filename}: {message.validation_message}", file=sys.stderr)
        failed = failed or bool(messages)
    except Exception as error:
        print(f"{filename}: {error}", file=sys.stderr)
        failed = True
sys.exit(1 if failed else 0)
