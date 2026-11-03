const requireApiAuth = (req, res, next) => {
    if (!req.oidc?.isAuthenticated()) {
        return res.status(401).json({
            message: 'Authentication required.'
        });
    }

    next();
};

export default requireApiAuth;