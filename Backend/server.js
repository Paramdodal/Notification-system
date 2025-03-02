const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json()); 


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

//  Schema
const notificationSchema = new mongoose.Schema({
    user: String, 
    action: String, 
    fullMessage: String, 
    status: { type: String, default: "unread" }, 
    createdAt: { type: Date, default: Date.now }
});


const Notification = mongoose.model("Notification", notificationSchema);

app.get("/notifications", async (req, res) => {
    try {
        let { page = 1, limit = 5, search = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const searchQuery = search
            ? { $or: [
                { user: { $regex: search, $options: "i" } },
                { action: { $regex: search, $options: "i" } },
                { fullMessage: { $regex: search, $options: "i" } }
            ]}
            : {};

        const total = await Notification.countDocuments(searchQuery);
        const unreadCount = await Notification.countDocuments({ status: "unread" });

        const notifications = await Notification.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ total, unreadCount, page, limit, data: notifications });
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications", error });
    }
});


app.put("/notifications/read-all", async (req, res) => {
    try {
        const updatedNotifications = await Notification.updateMany(
            { status: "unread" }, 
            { $set: { status: "read" } }
        );

        res.json({ message: "All notifications marked as read", updated: updatedNotifications });
    } catch (error) {
        res.status(500).json({ message: "Error marking all as read", error });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
