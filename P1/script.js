// ⚠️ TODO: Replace this with your own Firebase Config from your Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Reference to "complaints" collection
const complaintsCol = db.collection("complaints");

// ✅ REAL-TIME LISTENER FOR COMPLAINTS
complaintsCol.orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    let output = "";
    snapshot.forEach((docSnap) => {
        let c = docSnap.data();
        let id = docSnap.id; // Firestore Document ID
        
        output += `
        <div class="card">
            <p><b>${c.regNo}</b> | ${c.name} | Room: ${c.room}</p>
            <p>${c.issue}</p>
            <p>Status: ${c.status}</p>

            ${c.status === "Pending"
                ? `<button onclick="resolve('${id}')">Resolve</button>`
                : `<p>Resolved ✅</p>
                   ${c.photo ? `<img src="${c.photo}" width="100" style="margin-top: 10px; border-radius: 4px; border: 1px solid #ccc;"/>` : ''}`
            }
        </div>
        `;
    });
    let listElement = document.getElementById("list");
    if(listElement) {
        listElement.innerHTML = output;
    }
}, (error) => {
    console.error("Error loading complaints from Firebase:", error);
    let listElement = document.getElementById("list");
    if (listElement) {
        if(error.code === 'permission-denied') {
            listElement.innerHTML = "<p style='color:red;'>⚠️ Error: Permission denied. Make sure your Firestore Database is created and rules are set to Test Mode!</p>";
        } else if (error.code === 'invalid-api-key') {
            listElement.innerHTML = "<p style='color:red;'>⚠️ Please update the firebaseConfig in script.js with your real keys!</p>";
        } else {
            listElement.innerHTML = `<p style='color:red;'>⚠️ Firebase Error: ${error.message}</p>`;
        }
    }
});

// ✅ ADD COMPLAINT (FIREBASE)
window.addComplaint = async function () {
    let regNo = document.getElementById("regNo").value;
    let name = document.getElementById("name").value;
    let room = document.getElementById("room").value;
    let issue = document.getElementById("issue").value;

    if (!regNo || !name || !room || !issue) {
        alert("Please fill all fields!");
        return;
    }

    try {
        await complaintsCol.add({
            regNo: regNo,
            name: name,
            room: room,
            issue: issue,
            status: "Pending",
            photo: "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Complaint Added to Firebase Successfully!");

        // Clear inputs
        document.getElementById("regNo").value = "";
        document.getElementById("name").value = "";
        document.getElementById("room").value = "";
        document.getElementById("issue").value = "";

    } catch (error) {
        console.error("Error adding complaint:", error);
        alert(`❌ Error: ${error.message}\n\nDid you forget to update your Firebase Config in script.js?`);
    }
};

// ✅ RESOLVE WITH IMAGE (FIREBASE)
window.resolve = function (id) {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {
        let file = input.files[0];
        if (!file) return;

        let reader = new FileReader();
        
        reader.onload = async function(e) {
            let url = e.target.result; // Base64 string
            
            try {
                await complaintsCol.doc(id).update({
                    status: "Resolved",
                    photo: url
                });
                
                alert("✅ Complaint Resolved in Firebase!");
            } catch (error) {
                console.error("Error resolving complaint:", error);
                if (error.code === 'invalid-argument' || error.message.includes('byte')) {
                     alert("❌ Error: The image file is too large for Firestore limits (~1MB base64). Please use a smaller image.");
                } else {
                     alert("❌ Error: " + error.message);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    input.click();
};