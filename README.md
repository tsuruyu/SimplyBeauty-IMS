# SimplyBeauty - Inventory Management System (IMS)
For partial requirement of CSSWENG.

# To run:
1. Setup all dependencies. Ensure that you have node.js and npm installed in your device.
```bash
npm install dotenv express express-handlebars handlebars mongoose bcrypt
```
2. Ensure that you have a running MongoDB cluster. Input these variables in your .env file.
```
MONGODB_URI=<YOUR_CONNECTION_URI_HERE>
SERVER_PORT=3000
```
3. Start with
```bash
node app.js
```