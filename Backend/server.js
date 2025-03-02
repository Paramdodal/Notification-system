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
    user: String, // e.g., "Aryan"
    action: String, // e.g., "commented on your photo"
    fullMessage: String, // e.g., "Aryan liked the photo and commented: 'Nice!'"
    status: { type: String, default: "unread" }, 
    createdAt: { type: Date, default: Date.now }
});


const Notification = mongoose.model("Notification", notificationSchema);

app.get("/notifications", async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 5;
        let skip = (page - 1) * limit;

        const total = await Notification.countDocuments();
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("user action fullMessage status createdAt"); // Fetch all necessary fields

        res.json({ total, page, limit, data: notifications });
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications", error });
    }
});



app.put("/notifications/:id/read", async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { status: "read" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification marked as read", notification });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification", error });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
