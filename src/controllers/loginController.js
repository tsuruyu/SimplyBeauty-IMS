const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { validatePasswordStrength } = require("../../public/scripts/passwordPolicy.js");
const AuditLogger = require('../services/auditLogger');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
const ALLOWED_ATTEMPTS = 5; // password attempts before lockout
const securityQuestionsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../seed/security_questions.json'), 'utf-8')
);

// ------------------------
// LOGIN PAGE
// ------------------------
async function getLoginPage(req, res) {
    const success =
        req.query.reset === 'success' ? 'Password and security questions updated successfully!' : null;
        req.query.logout === 'success' ? 'You have logged out.' : null;

    res.render('login', {
        title: 'Login',
        error: null,
        success
    });
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
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: 'validation_fail',
                description: `Attempted non-existent ${email} reset from IP ${req.ip}`,
                status: 'fail',
                ip_address: req.ip
            });

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
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: 'validation_fail',
                description: `Failed security question verification for ${user.email} from IP ${req.ip}`,
                status: 'fail',
                ip_address: req.ip
            });

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
        req.session.password_reset_email = email;
        return res.redirect('/reset_password');


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
    const email = req.session.password_reset_email;

    if (!email) {
        return res.render('login', {
            title: 'Login',
            error: 'Unauthorized request. Please restart password reset.',
            success: null
        });
    }

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
        const email = req.session.password_reset_email;
        const { new_password, new_questions } = req.body;

        if (!email) {
            return res.render('login', {
                title: 'Login',
                error: 'Unauthorized reset attempt.',
                success: null
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.render('reset_password', {
                email,
                error: 'Invalid request.',
                security_questions: securityQuestionsData
            });
        }
        
        // Enforce minimum password age of 24 hours
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - user.password.last_updated.getTime() < ONE_DAY) {
            return res.render('reset_password', {
                email,
                error: 'Password cannot be changed yet. Minimum password age is 24 hours.',
                security_questions: securityQuestionsData
            });
        }

        // Prevent using the old password as the new password
        const isSamePassword = await bcrypt.compare(new_password, user.password.value);

        if (isSamePassword) {
            return res.render('reset_password', {
                email,
                error: 'New password cannot be the same as your old password.',
                security_questions: securityQuestionsData
            });
        }

        // Prevent using any previous password from history
        if (user.password.prev_value) {
            const previousPasswords = Array.isArray(user.password.prev_value)
                ? user.password.prev_value
                : [user.password.prev_value];

            for (const oldPw of previousPasswords) {
                const reused = await bcrypt.compare(new_password, oldPw);
                if (reused) {
                    return res.render('reset_password', {
                        email,
                        error: "New password cannot match any of your previously used passwords.",
                        security_questions: securityQuestionsData
                    });
                }
            }
        }

        // Validate password strength
        const pwCheck = validatePasswordStrength(new_password);
        
        if (!pwCheck.valid) {
            return res.render('reset_password', {
                email,
                error: pwCheck.errors.join(" "),
                security_questions: securityQuestionsData
            });
        }

        // Update password
        user.password.value = await bcrypt.hash(new_password, SALT_ROUNDS);
        user.password.last_updated = new Date();

        // Keep password history (up to last 5)
        if (!Array.isArray(user.password.prev_value)) {
            user.password.prev_value = [];
        }

        user.password.prev_value.unshift(user.password.value); // push recent old PW to history

        // limit history to last 5
        user.password.prev_value = user.password.prev_value.slice(0, 5);


        // Update security questions
        const updated = [];

        for (let i = 0; i < 2; i++) {
            const q = new_questions[i];

            const rawAnswer = (q.answer ?? "").trim();

            const answer = rawAnswer
                ? await bcrypt.hash(rawAnswer, SALT_ROUNDS)
                : user.password[`security_question_${i + 1}`][0].answer;

            updated.push({ question: q.question, answer });
        }

        user.password.security_question_1 = [updated[0]];
        user.password.security_question_2 = [updated[1]];

        await user.save();

        req.session.password_reset_email = null;

        return res.redirect('/login?reset=success');


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
        const ipAddress = req.ip;

        // -----------------------
        //  INPUT VALIDATION
        // -----------------------
        if (!username || !password) {
            await AuditLogger.logAction({
                username: username || 'unknown',
                action_type: 'validation_fail',
                description: `Login attempt with missing username or password from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

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

        // -----------------------
        //  INVALID USER
        // -----------------------
        if (!user) {
            await AuditLogger.logAction({
                username,
                action_type: 'login_failure',
                description: `Login attempt with invalid username ${username} from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.render('login', {
                title: 'Login',
                error: 'Invalid username or password',
                success: null
            });
        }

        // -----------------------
        //  ACCOUNT LOCKOUT CHECK
        // -----------------------
        const now = new Date();
        if (user.lock_until && user.lock_until > now) {
            const minutesLeft = Math.ceil((user.lock_until - now) / 60000);

            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: 'access_denied',
                description: `Login attempt for ${user.email} while account locked for ${minutesLeft} minute(s) from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.render('login', {
                title: 'Login',
                error: `Account is locked. Try again in ${minutesLeft} minute(s).`,
                success: null
            });
        }

        // -----------------------
        //  PASSWORD CHECK
        // -----------------------
        const valid = await bcrypt.compare(password, user.password.value);
        user.last_attempt = now;

        if (!valid) {
            user.failed_attempts++;
            const attemptsLeft = ALLOWED_ATTEMPTS - user.failed_attempts;

            if (user.failed_attempts >= ALLOWED_ATTEMPTS) {
                user.lock_until = new Date(Date.now() + 1 * 60 * 1000); // 1 minute lock
                user.failed_attempts = 0;
                await user.save();

                await AuditLogger.logAction({
                    user_id: user._id,
                    username: user.email,
                    action_type: 'login_failure',
                    description: `Account locked after too many failed login attempts for ${user.email} from IP ${ipAddress}`,
                    status: 'fail',
                    ip_address: ipAddress
                });

                return res.render('login', {
                    title: 'Login',
                    error: `Too many failed attempts. Account locked for 1 minute.`,
                    success: null
                });
            }

            await user.save();

            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: 'login_failure',
                description: `Invalid password attempt for ${user.email} from IP ${ipAddress}. Attempts left: ${attemptsLeft}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.render('login', {
                title: 'Login',
                error: `Invalid username or password.`,
                success: null
            });
        }

        // -----------------------
        //  SUCCESSFUL LOGIN
        // -----------------------
        const lastLoginMessage = user.last_login
            ? `Last login: ${user.last_login.toLocaleString()}`
            : "This is your first login.";

        user.failed_attempts = 0;
        user.lock_until = null;
        user.last_login = now;
        await user.save();

        await AuditLogger.logAction({
            user_id: user._id,
            username: user.email,
            action_type: 'login',
            description: `User ${user.email} logged in successfully from IP ${ipAddress}`,
            status: 'success',
            ip_address: ipAddress
        });

        // -----------------------
        //  SESSION SETUP
        // -----------------------
        req.session.user = {
            id: user._id.toString(),
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            brand_name: user.brand_name,
            last_login_message: lastLoginMessage
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
