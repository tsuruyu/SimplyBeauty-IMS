const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const securityQuestionsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../seed/security_questions.json'), 'utf-8')
);

// ------------------------
// LOGIN PAGES
// ------------------------
async function getLoginPage(req, res) {
    res.render('login', { title: 'Login', error: null, success: null });
}

// ------------------------
// FORGOT PASSWORD START
// ------------------------
async function getForgotPasswordPage(req, res) {    
    res.render('forgot_password', {
        title: 'Forgot Password',
        error: null,
        success: null
    });
}

async function handleForgotPasswordRequest(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('forgot_password', {
                title: 'Forgot Password',
                error: 'Email not found',
                success: null
            });
        }

        const questions = [
            user.password.security_question_1[0],
            user.password.security_question_2[0]
        ].map(q => ({ question: q.question }));

        return res.render('forgot_password', {
            title: 'Forgot Password',
            email,
            questions
        });

    } catch (err) {
        return res.render('forgot_password', {
            title: 'Forgot Password',
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
}

// ------------------------
// STEP 2: VERIFY SECURITY ANSWERS
// ------------------------
async function verifySecurityAnswers(req, res) {
    try {
        const { email, answers } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('forgot_password', {
                error: 'Invalid request',
                title: 'Forgot Password'
            });
        }

        const isValid = await Promise.all([
            bcrypt.compare(answers[0], user.password.security_question_1[0].answer),
            bcrypt.compare(answers[1], user.password.security_question_2[0].answer)
        ]);

        if (!isValid.every(Boolean)) {
            return res.render('forgot_password', {
                email,
                questions: [
                    { question: user.password.security_question_1[0].question },
                    { question: user.password.security_question_2[0].question }
                ],
                error: 'Security answers are incorrect.'
            });
        }

        // Proceed to password reset
        return res.redirect(`/reset_password?email=${email}`);

    } catch (err) {
        return res.render('forgot_password', {
            title: 'Forgot Password',
            error: 'Unexpected error. Try again.'
        });
    }
}

// ------------------------
// STEP 3: SHOW RESET PASSWORD PAGE
// ------------------------
async function getResetPasswordPage(req, res) {
    const { email } = req.query;

    return res.render('reset_password', {
        email,
        security_questions: securityQuestionsData
    });
}

// ------------------------
// STEP 4: RESET PASSWORD + QUESTIONS
// ------------------------
async function handleResetPassword(req, res) {
    try {
        const { email, new_password, new_questions } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('reset_password', {
                email,
                error: 'Invalid request.',
                security_questions: securityQuestionsData
            });
        }

        // Update password
        user.password.value = await bcrypt.hash(new_password, 10);
        user.password.last_updated = new Date();

        // Update security questions
        const updated = [];

        for (let i = 0; i < 2; i++) {
            const q = new_questions[i];

            const rawAnswer = (q.answer ?? "").trim();

            const answer = rawAnswer
                ? await bcrypt.hash(rawAnswer, 10)
                : user.password[`security_question_${i + 1}`][0].answer;

            updated.push({ question: q.question, answer });
        }

        user.password.security_question_1 = [updated[0]];
        user.password.security_question_2 = [updated[1]];

        await user.save();

        return res.render('login', {
            email,
            success: 'Password and security questions updated successfully!',
            security_questions: securityQuestionsData
        });

    } catch (err) {
        return res.render('reset_password', {
            email: req.body.email,
            error: 'An error occurred. Please try again.',
            security_questions: securityQuestionsData
        });
    }
}

// ------------------------
// LOGIN HANDLER
// ------------------------
async function handleLoginRequest(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('login', {
                title: 'Login',
                error: 'Please enter both username and password',
                success: null
            });
        }

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

        const valid = await bcrypt.compare(password, user.password.value);
        if (!valid) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid username or password',
                success: null
            });
        }

        // Store user session
        req.session.user = {
            id: user._id.toString(),
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            brand_name: user.brand_name
        };

        const redirectMap = {
            employee: '/user/manage_products',
            vendor: '/vendor/product_dashboard',
            admin: '/admin/manage_users'
        };

        return res.redirect(redirectMap[user.role] || '/login');

    } catch (error) {
        return res.render('login', {
            title: 'Login',
            error: 'An error occurred during login. Please try again.',
            success: null
        });
    }
}

// ------------------------
// LOGOUT
// ------------------------
async function handleLogoutRequest(req, res) {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout failed');
        res.clearCookie('connect.sid');
        res.redirect('/login?logout=success');
    });
}

module.exports = {
    getLoginPage,
    handleLoginRequest,
    handleLogoutRequest,
    getForgotPasswordPage,
    handleForgotPasswordRequest,
    verifySecurityAnswers,
    getResetPasswordPage,
    handleResetPassword
};
