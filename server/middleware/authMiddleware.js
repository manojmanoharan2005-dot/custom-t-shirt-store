const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message:
          "Not authorized, malformed Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.trim() === "") {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Not authorized, expired token",
      });
    } else if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: `Not authorized, invalid signature or token: ${error.message}`,
      });
    }

    return res.status(401).json({
      message: `Not authorized, token verification failed: ${error.message}`,
    });
  }
};

module.exports = protect;