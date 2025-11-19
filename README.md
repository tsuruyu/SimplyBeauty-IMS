# SimplyBeauty - Inventory Management System (IMS)
For partial requirement of CSSWENG and CSSECDV. This website source is not deployed and should not be deployed anywhere outside of academic requirement.

# How To Run:
1. Setup all dependencies. Ensure that you have node.js and npm installed in your device.
```bash
npm install bcrypt dotenv ejs express-handlebars express-session express faker hbs json2csv mongoose nodemon path pdfkit
```
2. Ensure that you have a running MongoDB Atlas cluster. Input these variables in your .env file.
```
MONGODB_URI=<YOUR_CONNECTION_URI_HERE>
SERVER_PORT=3000
SESSION_SECRET=<YOUR_SESSION_SECRET_HERE>
```
3. For Windows, start with
```bash
node app.js
```

# Database Seeding:
1. We provided a script to automatically seed your database. Ensure that your connection URL is in your .env file.
```bash
npm run seed
```
2. To mimic a randomized sale history across three months from now, run:
```bash
npm run sale
```