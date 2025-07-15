require('dotenv').config();

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');

const router = require('./src/routes/router.js');
const { connect, disconnect }= require('./config/db.js');

const app = express();

function initializeStaticFiles(){
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/assets', express.static('public/assets'));
}

function initializeHandlebars(){
    app.engine("hbs", exphbs.engine({
        extname: "hbs",
        defaultLayout: false,
        partialsDir: path.join(__dirname, 'src', 'views', 'partials'),
        helpers: {
            eq: function (a, b) {
                if (typeof a === 'string') a = a.trim();
                if (typeof b === 'string') b = b.trim();
                return a === b;
            },
            isActive: function (path, currentPath, options) {
                if (typeof path === 'string') path = path.trim();
                if (typeof currentPath === 'string') currentPath = currentPath.trim();
                return path === currentPath ? options.fn(this) : options.inverse(this);
            },
            formatDate: function (dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                });
            }
        }
    }));
    app.set("view engine", "hbs");
    app.set('views', path.join(__dirname, 'src', 'views')); 
}

async function finalClose(){
    await disconnect().then(console.log('Server closed!'));
    process.exit();
}

async function main(){
    initializeStaticFiles();
    initializeHandlebars();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true
        }
    }));

    app.use(router);

    app.listen(process.env.SERVER_PORT, async () => {
        console.log(`Express server is now listening on port ${process.env.SERVER_PORT}`);
        try {
            await connect();
            console.log(`Now connected to MongoDB`);
            
        } catch (err) {
            console.log('Connection to MongoDB Server failed:');
            console.error(err);
        }
    });

    process.on('SIGTERM',finalClose);  
    process.on('SIGINT', finalClose); 
    process.on('SIGQUIT', finalClose);
}

main();