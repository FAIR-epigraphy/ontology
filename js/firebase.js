// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtuungd1Bs_RJi3aHgk5l2Ay3VcdygEcI",
    authDomain: "graffitigazetteerdb.firebaseapp.com",
    projectId: "graffitigazetteerdb",
    storageBucket: "graffitigazetteerdb.firebasestorage.app",
    messagingSenderId: "21577695168",
    appId: "1:21577695168:web:c1559b57f5299f93821225"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// access github token
var accessToken = '';
var headers = '';
(async () => {
    const querySnapshot = await db.collection('ghToken').get();
    querySnapshot.forEach((doc) => {
        accessToken = doc.data().token;
        headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    });
})();

async function generateHash(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);  // Convert string to bytes
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);  // Generate hash
    const hashArray = Array.from(new Uint8Array(hashBuffer));  // Convert buffer to byte array
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');  // Convert byte array to hex string
    return hashHex;
}

// Function to compare two hashes
async function compareHashes(password, hashToCompare) {
    const generatedHash = await generateHash(password);
    return generatedHash === hashToCompare;
}

let interval = setInterval(() => {
    if (document.getElementById('loginForm')) {
        clearInterval(interval);
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('loginError');

            try {
                // Reference to the collection
                const querySnapshot = await db.collection('admin').get();

                // Iterate through the documents in the collection
                querySnapshot.forEach(async (doc) => {
                    //console.log(doc.id, " => ", doc.data());
                    if (doc.data().username == username && await compareHashes(password, doc.data().password)) {
                        $('#adminLogin').addClass('d-none');
                        $('#adminPanel').removeClass('d-none');
                    } else {
                        errorElement.textContent = 'Invalid username or password';
                    }
                });
            } catch (error) {
                errorElement.textContent = error.message;
            }
        });
    }
}, 1000);

