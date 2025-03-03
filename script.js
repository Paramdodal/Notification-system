const API_URL = "http://localhost:5000/notifications"; // Backend API URL
let currentPage = 1;
const limit = 5;

async function fetchNotifications(page = 1, append = false) {
    try {
        const searchQuery = document.getElementById("search-input").value.trim();
        console.log(`Fetching notifications for page ${page}... Search: ${searchQuery}`);

        const response = await fetch(`${API_URL}?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error("Failed to fetch notifications");

        const result = await response.json();
        renderNotifications(result.data, append);
        updateNotificationCount(result.unreadCount);

        if (page * limit >= result.total) {
            document.getElementById("load-more").style.display = "none";
        } else {
            document.getElementById("load-more").style.display = "block";
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
}

let debounceTimer;
function handleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentPage = 1;
        fetchNotifications(currentPage, false);
    }, 500); 
}
function clearSearch() {
    document.getElementById("search-input").value = "";
    handleSearch();
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
        li.setAttribute("data-full-message", notification.fullMessage || "No details available");

        
        li.addEventListener("click", function () {
            openNotification(notification._id, li);
        });

        notificationList.appendChild(li);
    });

    updateNotificationCount();
}


async function openNotification(notificationId, element) {
    try {
        console.log("Opening notification:", notificationId);

        const fullMessage = element.getAttribute("data-full-message") || "No details available";
        document.getElementById("notification-message").textContent = fullMessage;
        document.getElementById("notification-modal").style.display = "flex"; 

        // ✅ If the notification is already read, do nothing
        if (!element.classList.contains("unread")) return;

        // ✅ Send request to backend to mark as read
        const response = await fetch(`${API_URL}/${notificationId}/read`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to update notification");

        console.log("Notification marked as read successfully");

        element.classList.remove("unread");
        element.innerHTML = element.innerHTML.replace("🔵", "✅");

        const unreadElements = document.querySelectorAll("#notification-list li.unread");
        updateNotificationCount(unreadElements.length - 1);

    } catch (error) {
        console.error("Error opening notification:", error);
    }
}

function closeNotification() {
    document.getElementById("notification-modal").style.display = "none";
}



async function markAllRead() {
    try {
        const response = await fetch(`${API_URL}/read-all`, { 
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to mark all as read");

        console.log("All notifications marked as read successfully");

        document.querySelectorAll("#notification-list li.unread").forEach((item) => {
            item.classList.remove("unread");
            item.innerHTML = item.innerHTML.replace("🔵", "✅");
        });

        updateNotificationCount(0);

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

    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";

        currentPage = 1;
        fetchNotifications(currentPage, false); 
    }
}


function updateNotificationCount(unreadCount) {
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
