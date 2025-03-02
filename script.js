const API_URL = "http://localhost:5000/notifications"; // Backend API URL
let currentPage = 1;
const limit = 5;


async function fetchNotifications(page = 1, append = false) {
    try {
        console.log(`Fetching notifications for page ${page}...`);
        const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
        if (!response.ok) throw new Error("Failed to fetch notifications");

        const result = await response.json();
        console.log("Fetched data:", result);

        renderNotifications(result.data, append);

        
        if (page * limit >= result.total) {
            document.getElementById("load-more").style.display = "none";
        } else {
            document.getElementById("load-more").style.display = "block";
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
}


function renderNotifications(notifications, append) {
    const notificationList = document.getElementById("notification-list");
    if (!append) notificationList.innerHTML = ""; 

    if (notifications.length === 0) {
        notificationList.innerHTML = "<li>No new notifications</li>";
        return;
    }

    notifications.forEach((notification) => {
        const li = document.createElement("li");
        li.textContent = (notification.status === "unread" ? "🔵 " : "✅ ") + notification.user + " " + notification.action;
        li.classList.add(notification.status);
        li.setAttribute("data-id", notification._id);
        li.setAttribute("data-full-message", notification.fullMessage); // Store full message in attribute
        li.onclick = () => openNotification(notification._id, li, notification.fullMessage); // Pass fullMessage
        notificationList.appendChild(li);
    });

    updateNotificationCount();
}



async function openNotification(notificationId, element, fullMessage, openModal = true) {
    try {
        const response = await fetch(`${API_URL}/${notificationId}/read`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to update notification");

        element.classList.remove("unread");
        element.innerHTML = "✅ " + element.textContent.substring(2);

        updateNotificationCount();

        if (openModal) {
            const notificationMessage = document.getElementById("notification-message");
            const notificationModal = document.getElementById("notification-modal");

            notificationMessage.textContent = fullMessage;
            notificationModal.style.display = "flex";
        }

    } catch (error) {
        console.error("Error updating notification:", error);
    }
}




function closeNotification() {
    document.getElementById("notification-modal").style.display = "none";
}


async function markAllRead() {
    try {
        const response = await fetch(`${API_URL}/read-all`, { method: "PUT" });
        if (!response.ok) throw new Error("Failed to mark all as read");

        document.querySelectorAll("#notification-list li.unread").forEach((item) => {
            item.classList.remove("unread");
            item.innerHTML = "✅ " + item.textContent.substring(2);
        });

        updateNotificationCount();

    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
}



function loadMore() {
    currentPage++;
    fetchNotifications(currentPage, true); 
}


function toggleNotifications() {
    const dropdown = document.getElementById("notification-dropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

    if (dropdown.style.display === "block") {
        fetchNotifications(); 
    }
}


function updateNotificationCount() {
    const unreadCount = document.querySelectorAll("#notification-list li.unread").length;
    const countElement = document.getElementById("notification-count");

    if (unreadCount > 0) {
        countElement.textContent = unreadCount;
        countElement.style.display = "inline"; 
    } else {
        countElement.style.display = "none"; 
    }
}


document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("notification-dropdown");
    const icon = document.querySelector(".notification-icon");
    const modal = document.getElementById("notification-modal");

    if (!icon.contains(event.target) && !dropdown.contains(event.target) && !modal.contains(event.target)) {
        dropdown.style.display = "none";
    }
});



document.getElementById("notification-modal").addEventListener("click", function (event) {
    const modalContent = document.querySelector(".modal-content");

    if (!modalContent.contains(event.target)) {
        closeNotification();
    }

    event.stopPropagation();
});



document.addEventListener("DOMContentLoaded", () => fetchNotifications());
