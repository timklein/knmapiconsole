# KNM API Console Documentation
Documentation for the KNM Infusionsoft API Console Application.

## Installation
Clone repository to the desired server location. `cd` into the installation directory and run `npm install`

Remove `.sample` extension from `.env.sample` and replace the descriptions with valid configuration values.

## ToDo
* Beef up error catch logic
* Add logging support
* ~~Add auto token refresh logic~~
* ~~Update DB name and move connection to separate module~~
* ~~Move Infusionsoft authorization code to controller~~
* ~~Save initial token with new schema~~
* ~~Revise refresh logic to use new schema~~
* ~~Figure out how to trigger initial token request and refresh~~
* ~~Add function to create connection name~~
* ~~Refresh based off id rather than app_name~~
* ~~Figure out how to use environment variable for Navbar link in layout.pug~~