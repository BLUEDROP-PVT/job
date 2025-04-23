const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userSignedOutSection = document.getElementById('user-signed-out');
const userSignedInSection = document.getElementById('user-signed-in');
const userNameElem = document.getElementById('user-name');
const userPicElem = document.getElementById('user-pic');
const messagesList = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDh5twfwkFaVHbPeaZ2D3FLdNxRScVrGGY",
  authDomain: "bluedrop-eccbb.firebaseapp.com",
  databaseURL: "https://bluedrop-eccbb-default-rtdb.firebaseio.com",
  projectId: "bluedrop-eccbb",
  storageBucket: "bluedrop-eccbb.firebasestorage.app",
  messagingSenderId: "820696594586",
  appId: "1:820696594586:web:c685de23a831c59ec9c723",
  measurementId: "G-KGN4QW4XWX"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

const socket = io();

signInBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

signOutBtn.addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    userSignedOutSection.classList.add('hidden');
    userSignedInSection.classList.remove('hidden');
    userNameElem.textContent = user.displayName;
    userPicElem.src = user.photoURL || 'https://via.placeholder.com/40';
    loadMessages();
    listenForAdminReplies(user.uid);
  } else {
    userSignedOutSection.classList.remove('hidden');
    userSignedInSection.classList.add('hidden');
    userNameElem.textContent = '';
    userPicElem.src = '';
    messagesList.innerHTML = '';
  }
});

function loadMessages() {
  const messagesRef = db.ref('quiries');
  messagesRef.limitToLast(50).on('value', snapshot => {
    messagesList.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const message = childSnapshot.val();
      displayMessage(message);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
  });
}

function displayMessage(message) {
  const li = document.createElement('li');
  li.classList.add(message.uid === (auth.currentUser && auth.currentUser.uid) ? 'self' : 'other');

  const img = document.createElement('img');
  img.src = message.photoURL || 'https://via.placeholder.com/30';
  img.alt = message.name;
  img.classList.add('message-pic');

  const content = document.createElement('div');
  content.classList.add('message-content');

  const nameSpan = document.createElement('span');
  nameSpan.classList.add('message-name');
  nameSpan.textContent = message.name;

  const textSpan = document.createElement('span');
  textSpan.classList.add('message-text');
  textSpan.textContent = ': ' + message.text;

  content.appendChild(nameSpan);
  content.appendChild(textSpan);

  li.appendChild(img);
  li.appendChild(content);

  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function displayAdminReply(reply) {
  const li = document.createElement('li');
  li.classList.add('admin-reply');

  const content = document.createElement('div');
  content.classList.add('message-content');

  const nameSpan = document.createElement('span');
  nameSpan.classList.add('message-name');
  nameSpan.textContent = 'Admin';

  const textSpan = document.createElement('span');
  textSpan.classList.add('message-text');
  textSpan.textContent = ': ' + reply.text;

  content.appendChild(nameSpan);
  content.appendChild(textSpan);

  li.appendChild(content);

  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function listenForAdminReplies(userUid) {
  const messagesRef = db.ref('quiries');
  messagesRef.orderByChild('uid').equalTo(userUid).on('value', snapshot => {
    snapshot.forEach(childSnapshot => {
      const messageKey = childSnapshot.key;
      const repliesRef = db.ref('replies/' + messageKey);
      repliesRef.on('child_added', replySnapshot => {
        const reply = replySnapshot.val();
        displayAdminReply(reply);
      });
    });
  });
}

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text) {
    const user = auth.currentUser;
    const messagesRef = db.ref('quiries');
    // Push user message to Firebase
    messagesRef.push({
      uid: user.uid,
      name: user.displayName,
      photoURL: user.photoURL || '',
      text: text,
      timestamp: Date.now()
    });
    displayMessage({
      uid: user.uid,
      name: user.displayName,
      photoURL: user.photoURL || '',
      text: text
    });
    messageInput.value = '';

    // Send message to server via socket.io
    socket.emit('chat message', {
      uid: user.uid,
      name: user.displayName,
      photoURL: user.photoURL || '',
      text: text,
      timestamp: Date.now()
    });
  }
});

// Listen for chat messages from server
socket.on('chat message', (msg) => {
  if (msg.uid !== (auth.currentUser && auth.currentUser.uid)) {
    displayMessage(msg);
  }
});
