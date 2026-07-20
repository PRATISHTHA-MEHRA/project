// Usage: router.post("/", authMiddleware, authorize("super_admin"), controller.fn)
// Runs AFTER authMiddleware — relies on req.user being set by the JWT decode.

module.exports = (...allowedRoles) => {

    return (req, res, next) => {
         console.log("DEBUG req.user:", req.user, "| allowedRoles:", allowedRoles);

        if (!req.user || !allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: "Access Denied: Insufficient permissions"
            });

        }

        next();

    };

};