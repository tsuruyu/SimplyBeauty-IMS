const bcrypt = require('bcrypt');
const User = require('../models/User');

async function getLoginPage(req, res) {
    res.render('login', {
        title: 'Login',
        error: null,
        success: null
    });
}

async function handleLoginRequest(req, res) {
    try {
        const { username, password } = req.body;
        
        // Basic validation
        if (!username || !password) {
            return res.render('login', {
                title: 'Login',
                error: 'Please enter both username and password',
                success: null
            });
        }

        // Find user by email or user_id
        const user = await User.findOne({
            $or: [
                { email: username.toLowerCase() },
                { user_id: username }
            ]
        });

        if (!user) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid username or password',
                success: null
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid username or password',
                success: null
            });
        }

        switch(user.role) {
            case "employee":
                try {
                    req.session.user = {
                    id: user._id.toString(),
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                };
                    console.log(req.session.user);
                    return res.redirect("/user/manage_products");
                } catch (err) {
                    console.error(err);
                    return res.status(403).send(err.message);
                }
            case "vendor":
                try {
                    req.session.user = {
                    id: user._id.toString(),
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    brand_name: user.brand_name,
                    created_at: user.created_at
                };
                    return res.redirect("/vendor/product_dashboard");
                } catch (err) {
                    console.error(err);
                    return res.status(403).send(err.message);
                }
            case "admin":
                try {
                    req.session.user = {
                    id: user._id.toString(),
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                };
                    return res.redirect("/admin/manage_users");
                } catch (err) {
                    console.error(err);
                    return res.status(403).send(err.message);
                }
            default:
               return res.status(500).render("Who are you?");
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.render('login', {
            title: 'Login',
            error: 'An error occurred during login. Please try again.',
            success: null
        });
    }
}

async function handleLogoutRequest(req, res) {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Logout failed');
            }
            
            res.clearCookie('connect.sid');

            res.redirect('/login?logout=success');
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('An error occurred during logout');
    }
}

module.exports = {
    getLoginPage,
    handleLoginRequest,
    handleLogoutRequest
};