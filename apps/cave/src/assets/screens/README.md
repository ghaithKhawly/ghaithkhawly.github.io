# Project screens

What each project's device shows when it steps out of the wall. All are real output
of the project's own code, captured from local builds; none are mockups.

| Project | Screens | How they were made |
|---|---|---|
| Rakeb | The route network | Drawn from the project's own route file (`front/assets/map/public_routes.kmz`): the real lines it routes over. The repo's `assets/design/` screens are generic mockups (another app's name and city), so they aren't used. Phone screenshots of the app itself are still to come. |
| Office Order | Today, menu, money | The app built and run locally, seeded with a made-up office (restaurant, menu, six colleagues, one day's orders), phone size. |
| Aquarium Object Detection | Four figures | Output cells of `main_project.ipynb`, fitted to a laptop screen. |
| Savings Tracker | Dashboard, trend, assets, history | The Expo web export, seeded with sample savings; prices are the app's own demo fallback. |
| justacalc | Home, calculator, algebra, calculus | The Expo web export (a scratch copy given the web packages it lacked), with worked examples typed in. |
| Taza | Landing page, how it works, the bot | The landing page built from `TazaWebsite`, phone size. The Telegram mini app with Telegram and its API stubbed, showing sample bags; an empty reserve dialog that shows on load (its `.hidden` rule loses to `.modal` in `style.css`) is hidden. |
| Gym Management System | Dashboard, members, check-in, finance | A web build of a scratch copy (Flutter 3.47): `sqflite` swapped for its web version (`sqflite_common_ffi_web`) and a made-up gym (twelve members, today's check-ins) added to the app's own seed data. Logged in with the app's demo admin account. Nothing else changed. |

Phone screens are 480 px wide, laptop screens 1024 px; WebP, quality 80. They load only
when their project opens.
