# Python backend (HTTP server) for analysis.
Minimal for now, just serving as proof-of-concept. This is a separate service from the Next.js app since to my knowledge Python has more robust libraries for analysis.

## Notes:
* This was developed on Python 3.10.12. Planning on dockerizing this (along with the Next.js app) once it's more functional.

## How to run:
First, set the following environmental variables to configure connection to a databaes. At the moment this only works with MySQL.
* `DB_URL`
...