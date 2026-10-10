# Navigation
- TeamVorpProject/app/page.tsx is our home page.

- All pages for display e.g. credits, home need to be named as "page.jsx" or it will not render.

- app/filenamehere is our individual features

- app/api/ is for API calls to LLM

- globals.css is our global css, not sure if we are using tailwind css or vanilla css.

- Naming for individual page css in your features has to end with ".module.css" e.g. page.module.css

- app/layout.tsx is for anything that should persist across page navigations without re-rendering.

- lib/ is for shared javascript

- components/ is for shared UI


# HackIT Team Vorp
NameOfApp is our one stop learning platform to help young adults integreate mother tongue into their daily lives by tackling the hesitation of practicing an unfamiliar language from multiple angles.

# How to run
Run `npm run dev` in command line interface<br>
Using React for frontend and Next.js template since React itself is purely frontend.<br>
.env file: Check discord pinned messages.

# Firebase link
[Firebase link](https://hackit-vorp-db-default-rtdb.asia-southeast1.firebasedatabase.app/)

# Figma wireframing 
[Wireframe link](https://www.figma.com/design/y6EjeLEndbZzAgAke1slRh/HackIT-wireframe?node-id=0-1&t=C3fNilFaBsavW9Tn-1)


# Google Docs discussion
https://docs.google.com/document/d/1bWnFUjsIkvIGe7DRwe2-Kcbe6fgvTSDnIYdTIaecSPA/edit


# Members

| Name                                  | Github Username     |
| ------------------------------------- | --------------------|
| Low Bao Shen (Team Leader)            | RotConsumesAll      |
| Wynn Lee                              | wxnn7               |
| Jovan Soo                             | Hilowandlowhi       |
| Matthew Tay                           | Spadnana            |
| Soh Yong Jia                          | yoooongjiaaaa39b-ux |


# Users
| Email                                 | Password            |
| ------------------------------------- | --------------------|
| Alice@example.com                     | Alice123            |
| Ben@example.com                       | Ben321              |


# Features and explanations
## Logging in
1. Input email and password, saved in memory (React state).
2. Form's submit handler checks both fields are not empty, calls login helper.
3. `signInWithEmailAndPassword` sends email and password to Firebase.
4. Firebase compares password against hash kept.
5. If match fails, throw error obj containing code (`error.code`).<br>Custom error messages are mapped to different error codes. Error messages are displayed to user.
6. If match, login succeeds.<br>Firebase sends signed token, browser saves.
7. `AuthProvider` listening via `onAuthStateChanged`. Receives user obj, sets `loading` to false and updates state.
8. Navbar swaps "Login" for "Logout". `RequireAuth` sees state of user obj and `loading`, lets protected pages render instead of redirect.

Tl;dr: Firebase checks, app reacts(!!!) to result.

## Feature here