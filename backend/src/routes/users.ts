import { Router } from "express";
import multer from "multer";
import {
  validateRequest,
  userSchemas,
  commonSchemas,
} from "@/middleware/validation";
import { authenticateToken, optionalAuth } from "@/middleware/auth";
import { userController } from "@/controllers/userController";

const router = Router();

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        )
      );
    }
  },
});

// GET /api/v1/users/profile - Get current user profile
router.get(
  "/profile",
  authenticateToken,
  userController.getCurrentUserProfile.bind(userController)
);

// PUT /api/v1/users/profile - Update current user profile
router.put(
  "/profile",
  authenticateToken,
  validateRequest({ body: userSchemas.updateProfile }),
  userController.updateCurrentUserProfile.bind(userController)
);

// POST /api/v1/users/avatar - Upload user avatar
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  userController.uploadAvatar.bind(userController)
);

// GET /api/v1/users/preferences - Get user preferences
router.get(
  "/preferences",
  authenticateToken,
  userController.getUserPreferences.bind(userController)
);

// PUT /api/v1/users/preferences - Update user preferences
router.put(
  "/preferences",
  authenticateToken,
  validateRequest({ body: userSchemas.updatePreferences }),
  userController.updateUserPreferences.bind(userController)
);

// GET /api/v1/users/profile/completeness - Get profile completeness
router.get(
  "/profile/completeness",
  authenticateToken,
  userController.getProfileCompleteness.bind(userController)
);

// GET /api/v1/users/search - Search and discover users
router.get(
  "/search",
  optionalAuth,
  validateRequest({ query: userSchemas.searchUsers }),
  userController.searchUsers.bind(userController)
);

// GET /api/v1/users/:id - Get user by ID
router.get(
  "/:id",
  optionalAuth,
  validateRequest({ params: userSchemas.getUserById }),
  userController.getUserById.bind(userController)
);

// DELETE /api/v1/users/account - Delete user account
router.delete(
  "/account",
  authenticateToken,
  userController.deleteAccount.bind(userController)
);

export default router;
