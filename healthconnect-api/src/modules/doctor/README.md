# Doctor Profile v2

This module owns only the authenticated Doctor Profile contract while the remaining existing doctor routes continue through `src/routes/doctor.routes.ts` unchanged.

## Canonical endpoints

- `GET /api/v1/doctor/profile`
- `GET /api/v1/doctor/profile/completion`
- `PUT /api/v1/doctor/profile`
- `PUT /api/v1/doctor/profile/availability`
- `PUT /api/v1/doctor/profile/consultation-modes`

## Core profile completion

Core completion is based only on essential doctor identity and professional-practice information:

1. First name
2. Last name
3. Valid Indian mobile number
4. Date of birth
5. Gender
6. Specialization
7. At least one qualification
8. Years of experience
9. Medical registration / license number
10. Medical council
11. Practice city
12. Practice state

Narrative, social-proof, consultation-mode and availability fields are optional and do not reduce core completion.

## Compatibility

Recognized legacy aliases are normalized at the API boundary. Unknown legacy profile fields are stripped/no-op rather than creating a new breaking error response. Verification status, HC Doctor ID and admin verification metadata are not doctor-editable.
