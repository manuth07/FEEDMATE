import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJDkelKLZ6HcNirigD9rPHpFnWNxcpcb8",
    authDomain: "website-hosting-a5a67.firebaseapp.com",
    databaseURL: "https://website-hosting-a5a67-default-rtdb.firebaseio.com",
    projectId: "website-hosting-a5a67",
    storageBucket: "website-hosting-a5a67.firebasestorage.app",
    messagingSenderId: "195781792700",
    appId: "1:195781792700:web:0ef43f97973be60b3011b9",
    measurementId: "G-2TXFM6X6TF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// References to Firebase nodes
const feedNowRef = ref(database, 'feeding/feednow');
const feedingHistoryRef = ref(database, 'feedingHistory');

const sheduleRef = ref(database, 'shedule/sheduleTime');

// Function to handle manual feeding
async function handleManualFeed() {
    try {
        // Get selected portion size
        const portionSize = document.getElementById('portionSize').value;


        // Check if portion size is selected
        if (!portionSize) {
            alert("Please select a portion size before feeding.");
            return;
        }

        // Set feednow to true and send portion size
        await set(ref(database, 'feeding'), {
            feednow: true,
            portionSize: portionSize
        });

        // Add to feeding history
        const timestamp = new Date().toLocaleString();
        addToFeedingHistory(timestamp, portionSize);

        // Reset feednow to false after 5 seconds
        setTimeout(async () => {
            await set(feedNowRef, false);
        }, 5000);

        // Visual feedback
        const feedButton = document.querySelector('.bg-purple-500');
        feedButton.textContent = 'Feeding...';
        feedButton.disabled = true;

        setTimeout(() => {
            feedButton.textContent = 'Feed Now';
            feedButton.disabled = false;
            if(portionSize == "Small"){
                reducePercentage(15);
            }else if(portionSize == "Medium"){
                reducePercentage(25);
            }else if(portionSize == "Large"){
                reducePercentage(40);
            }
        }, 5000);

    } catch (error) {
        console.error('Error feeding:', error);
        alert('Failed to trigger feeding. Please try again.');
    }
}


// Function to add feeding event to history
function addToFeedingHistory(timestamp, portionSize) {
    // Add the feeding event to Firebase Realtime Database
    push(feedingHistoryRef, {
        time: timestamp,
        portionSize: portionSize
    }).catch((error) => {
        console.error("Error adding to feeding history in Firebase:", error);
    });

    // Update the UI with the new feeding history
    const historyList = document.getElementById('feedingHistory');
    const historyItem = document.createElement('li');
    historyItem.className = 'mb-2 text-gray-700';
    historyItem.textContent = `${timestamp} - ${portionSize} portion`;

    // Add new item at the beginning of the list
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }

    // Keep only last 10 entries
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Function to update clock
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString();
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Add click event listener to Feed Now button
    const feedButton = document.getElementById('feedbtn');
    if (feedButton) {
        feedButton.addEventListener('click', handleManualFeed);
    }

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Update calendar
    const calendarElement = document.getElementById('calendar');
    if (calendarElement) {
        const now = new Date();
        calendarElement.textContent = now.toLocaleDateString();
    }

    // // Listen for real-time updates to feednow status
    onValue(feedNowRef, (snapshot) => {
        const feedNowStatus = snapshot.val();
        const feedButton = document.querySelector('.bg-purple-500');
        const portionSelector = document.querySelector('portionsize');

        if (feedButton) {
            feedButton.disabled = feedNowStatus;
            feedButton.textContent = feedNowStatus ? 'Feeding...' : 'Feed Now';
        }
    });
});

// Publishing shedule to the database
document.getElementById("dataForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the page from refreshing

    // Get form values
    const time = document.getElementById("scheduleTime").value;
    const date = document.getElementById("scheduleDate").value;
    const portionSize = document.getElementById("portionSize").value;

    // Push data to Firebase
    const newRef = push(sheduleRef); // Create a new unique key under 'users'
    set(newRef, {
        time: time,
        date: date,
        portionSize: portionSize
    }).then(() => {
        alert("Data inserted successfully!");
    }).catch((error) => {
        console.error("Error inserting data:", error);
    });

    // Clear the form
    document.getElementById("dataForm").reset();
});

let currentPercentage = 100; // Starting percentage


function reducePercentage(reduceBy) {
    const progressBar = document.getElementById('progressBar');
    let steps = reduceBy; // Number of steps to reduce by
    let interval = setInterval(() => {
        if (currentPercentage > 0 && steps > 0) {
            currentPercentage -= 1; // Reduce by 1%
            steps--; // Decrease the remaining steps

            // Update progress bar width and text
            progressBar.style.width = currentPercentage + "%";
            progressBar.textContent = currentPercentage + "%";

            // Prevent negative values
            if (currentPercentage <= 0) {
                currentPercentage = 0;
                clearInterval(interval); // Stop the interval
            }
        } else {
            clearInterval(interval); // Stop the interval if steps are done
        }
    }, 100); // Delay of 100 milliseconds between each step
}
const progressBar = document.getElementById('progressBar');
progressBar.style.width = currentPercentage + "%";
progressBar.textContent = currentPercentage + "%";