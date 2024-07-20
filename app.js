import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

let people = [];
let transactions = {};
let selectedPersonId = null;
let isDashboard = false;
let isArabic = false;
let personToDelete = null;

$(document).ready(function() {
    $('#toggleBtn').click(function() {
        togglePage();
    });

    $('#settingsArea').hover(function() {
        $('#settingsDropdown').removeClass('hidden');
    }, function() {
        $('#settingsDropdown').addClass('hidden');
    });

    $('#toggleLangBtn').click(function() {
        toggleLanguage();
    });

    $('#cancelDelete').click(function() {
        $('#deleteConfirm').addClass('hidden');
    });

    $('#confirmDelete').click(function() {
        deletePerson();
        $('#deleteConfirm').addClass('hidden');
    });

    $('#cancelEdit').click(function() {
        $('#editPopup').addClass('hidden');
    });

    $('#saveEdit').click(function() {
        savePersonEdit();
        $('#editPopup').addClass('hidden');
    });

    $('#closeInfo').click(function() {
        $('#infoPopup').addClass('hidden');
    });

    $('#editInfo').click(function() {
        $('#infoPopup').addClass('hidden');
        $('#editPopup').removeClass('hidden');
    });

    $('#deleteInfo').click(function() {
        personToDelete = $('#edit-id').val();
        $('#infoPopup').addClass('hidden');
        $('#deleteConfirm').removeClass('hidden');
    });

    $('#transactionInfo').click(function() {
        loadTransactionHistoryPage();
    });

    loadPeopleFromFirestore();

    // Initial load
    loadHomePage();
});

async function loadPeopleFromFirestore() {
    people = [];
    const querySnapshot = await getDocs(collection(window.db, "people"));
    querySnapshot.forEach((doc) => {
        const person = { id: doc.id, ...doc.data() };
        people.push(person);
    });
    loadPeople();
    loadPeopleList();
}

function togglePage() {
    if (isDashboard) {
        loadHomePage();
        $('#toggleBtn').text(isArabic ? 'التحويل إلى لوحة القيادة' : 'Switch to Dashboard');
    } else {
        loadDashboardPage();
        $('#toggleBtn').text(isArabic ? 'التحويل إلى الصفحة الرئيسية' : 'Switch to Home');
    }
    isDashboard = !isDashboard;
}

function toggleLanguage() {
    isArabic = !isArabic;
    if (isArabic) {
        $('html').attr('dir', 'rtl');
        $('#toggleLangBtn').text('English');
        $('#toggleBtn').text('التحويل إلى لوحة القيادة');
    } else {
        $('html').attr('dir', 'ltr');
        $('#toggleLangBtn').text('العربية');
        $('#toggleBtn').text('Switch to Dashboard');
    }
    if (isDashboard) {
        loadDashboardPage();
    } else {
        loadHomePage();
    }
}

function loadHomePage() {
    const homeContent = isArabic ? `
        <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-2xl mb-4 text-center text-white">البحث وادارة الديون</h2>
            <div class="relative">
                <input type="text" id="search" placeholder="البحث عن الأسم" class="w-full p-2 mb-4 border border-gray-600 rounded bg-gray-700 text-white">
                <div id="suggestions" class="absolute bg-gray-800 border border-gray-600 rounded w-full text-white"></div>
            </div>
            <form id="transaction-form" class="mb-6">
                <div class="mb-4">
                    <label class="block text-white">الوصف:</label>
                    <input type="text" id="description" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white">
                </div>
                <div class="mb-4">
                    <label class="block text-white">القيمة بالدينار العراقي:</label>
                    <input type="number" id="amount" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                </div>
                <button type="submit" class="bg-green-500 text-white p-2 rounded">اضافة دين</button>
                <button type="button" id="discount-button" class="bg-red-500 text-white p-2 rounded">خصم الدين</button>
                <button type="button" id="downloadPdfHome" class="bg-blue-500 text-white p-2 rounded">تحميل PDF</button>
            </form>
            <h2 class="text-2xl mb-4 text-center text-white">تاريخ الحركات</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">معرف الحركة</th>
                            <th class="py-2">الوصف</th>
                            <th class="py-2">القيمة بالدينار العراقي</th>
                            <th class="py-2">التاريخ</th>
                            <th class="py-2">الوقت</th>
                        </tr>
                    </thead>
                    <tbody id="transaction-history">
                        <!-- Transactions will be dynamically added here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="py-2" colspan="4">المبلغ الكلي</td>
                            <td class="py-2" id="total-debt"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    ` : `
        <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-2xl mb-4 text-center text-white">Search and Manage Debts</h2>
            <div class="relative">
                <input type="text" id="search" placeholder="Search by name" class="w-full p-2 mb-4 border border-gray-600 rounded bg-gray-700 text-white">
                <div id="suggestions" class="absolute bg-gray-800 border border-gray-600 rounded w-full text-white"></div>
            </div>
            <form id="transaction-form" class="mb-6">
                <div class="mb-4">
                    <label class="block text-white">Description:</label>
                    <input type="text" id="description" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white">
                </div>
                <div class="mb-4">
                    <label class="block text-white">Amount (IQD):</label>
                    <input type="number" id="amount" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                </div>
                <button type="submit" class="bg-green-500 text-white p-2 rounded">Add Debt</button>
                <button type="button" id="discount-button" class="bg-red-500 text-white p-2 rounded">Discount Debt</button>
                <button type="button" id="downloadPdfHome" class="bg-blue-500 text-white p-2 rounded">Download PDF</button>
            </form>
            <h2 class="text-2xl mb-4 text-center text-white">Transaction History</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">Transaction ID</th>
                            <th class="py-2">Description</th>
                            <th class="py-2">Amount (IQD)</th>
                            <th class="py-2">Date</th>
                            <th class="py-2">Time</th>
                        </tr>
                    </thead>
                    <tbody id="transaction-history">
                        <!-- Transactions will be dynamically added here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="py-2" colspan="4">Total Debt</td>
                            <td class="py-2" id="total-debt"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    $('#content').html(homeContent);
    loadPeople();

    $('#search').on('input', function() {
        const query = $(this).val().toLowerCase();
        const suggestions = people.filter(person => person.name.toLowerCase().includes(query));
        displaySuggestions(suggestions);
    });

    $('#downloadPdfHome').click(function() {
        if (!selectedPersonId) return alert(isArabic ? 'يرجى اختيار شخص أولاً' : 'Please select a person first');
        generatePdf(selectedPersonId);
    });

    $('#transaction-form').off('submit').on('submit', async function(e) {
        e.preventDefault();
        if (!selectedPersonId) return alert(isArabic ? 'يرجى اختيار شخص أولاً' : 'Please select a person first');

        const description = $('#description').val();
        const amount = parseFloat($('#amount').val());
        const date = new Date();
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        if (!transactions[selectedPersonId]) {
            transactions[selectedPersonId] = [];
        }

        const transactionId = generateTransactionId(selectedPersonId);
        const newTransaction = { id: transactionId, description, amount, date: formattedDate, time: formattedTime, personId: selectedPersonId };
        transactions[selectedPersonId].push(newTransaction);

        await addDoc(collection(window.db, "transactions"), newTransaction);

        $('#transaction-form')[0].reset();
        loadTransactions(selectedPersonId);
    });

    $('#discount-button').off('click').on('click', async function() {
        if (!selectedPersonId) return alert(isArabic ? 'يرجى اختيار شخص أولاً' : 'Please select a person first');

        const description = $('#description').val();
        const amount = parseFloat($('#amount').val());
        const date = new Date();
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        if (!transactions[selectedPersonId]) {
            transactions[selectedPersonId] = [];
        }

        const transactionId = generateTransactionId(selectedPersonId);
        const newTransaction = { id: transactionId, description, amount: -amount, date: formattedDate, time: formattedTime, personId: selectedPersonId };
        transactions[selectedPersonId].push(newTransaction);

        await addDoc(collection(window.db, "transactions"), newTransaction);

        $('#transaction-form')[0].reset();
        loadTransactions(selectedPersonId);
    });
}

function displaySuggestions(suggestions) {
    const suggestionsBox = $('#suggestions');
    suggestionsBox.html('');
    suggestions.forEach(suggestion => {
        const div = $(`<div class="p-2 cursor-pointer text-white">${suggestion.name}</div>`);
        div.click(() => {
            $('#search').val(suggestion.name);
            $('#suggestions').html('');
            selectedPersonId = suggestion.id;
            loadTransactions(selectedPersonId);
        });
        suggestionsBox.append(div);
    });
    suggestionsBox.show();
}

function loadDashboardPage() {
    const dashboardContent = isArabic ? `
        <div class="bg-gray-800 p-6 rounded shadow-md mb-4">
            <h2 class="text-2xl mb-4 text-center text-white">اضافة عميل جديد</h2>
            <form id="person-form" class="mb-6">
                <div class="mb-4">
                    <label class="block text-white">الأسم:</label>
                    <input type="text" id="name" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                </div>
                <div class="mb-4">
                    <label class="block text-white">رقم الهاتف:</label>
                    <div class="flex">
                        <span class="p-2 bg-gray-700 text-white">+964</span>
                        <input type="text" id="phone" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-white">رقم الهاتف الثاني:</label>
                    <div class="flex">
                        <span class="p-2 bg-gray-700 text-white">+964</span>
                        <input type="text" id="phone2" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white">
                    </div>
                </div>
                <button type="submit" class="bg-blue-500 text-white p-2 rounded">اضافة عميل</button>
                <p id="error-message" class="text-red-500 mt-2 hidden">الاسم موجود بالفعل!</p>
            </form>
            <div class="relative">
                <input type="text" id="searchDashboard" placeholder="البحث عن الأسم" class="w-full p-2 mb-4 border border-gray-600 rounded bg-gray-700 text-white">
            </div>
            <h2 class="text-2xl mb-4 text-center text-white">قائمة الأشخاص</h2>
            <div class="table-container">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">معرف العميل</th>
                            <th class="py-2">الأسم</th>
                            <th class="py-2"></th>
                        </tr>
                    </thead>
                    <tbody id="people-list">
                        <!-- People will be dynamically added here -->
                    </tbody>
                </table>
            </div>
        </div>
    ` : `
        <div class="bg-gray-800 p-6 rounded shadow-md mb-4">
            <h2 class="text-2xl mb-4 text-center text-white">Add New Person</h2>
            <form id="person-form" class="mb-6">
                <div class="mb-4">
                    <label class="block text-white">Name:</label>
                    <input type="text" id="name" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                </div>
                <div class="mb-4">
                    <label class="block text-white">Phone Number:</label>
                    <div class="flex">
                        <span class="p-2 bg-gray-700 text-white">+964</span>
                        <input type="text" id="phone" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-white">Second Phone Number:</label>
                    <div class="flex">
                        <span class="p-2 bg-gray-700 text-white">+964</span>
                        <input type="text" id="phone2" class="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white">
                    </div>
                </div>
                <button type="submit" class="bg-blue-500 text-white p-2 rounded">Add Person</button>
                <p id="error-message" class="text-red-500 mt-2 hidden">Name already exists!</p>
            </form>
            <div class="relative">
                <input type="text" id="searchDashboard" placeholder="Search by name" class="w-full p-2 mb-4 border border-gray-600 rounded bg-gray-700 text-white">
            </div>
            <h2 class="text-2xl mb-4 text-center text-white">People List</h2>
            <div class="table-container">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">Customer ID</th>
                            <th class="py-2">Name</th>
                            <th class="py-2"></th>
                        </tr>
                    </thead>
                    <tbody id="people-list">
                        <!-- People will be dynamically added here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    $('#content').html(dashboardContent);
    loadPeopleList();

    $('#searchDashboard').on('input', function() {
        const query = $(this).val().toLowerCase();
        const filteredPeople = people.filter(person => person.name.toLowerCase().includes(query));
        displayPeople(filteredPeople);
    });

    $('#person-form').off('submit').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#name').val().trim();
        const phone = $('#phone').val().trim();
        const phone2 = $('#phone2').val().trim();

        if (!name || !phone) {
            $('#error-message').text(isArabic ? 'لا يمكن أن يكون الاسم أو رقم الهاتف فارغًا!' : 'Name and Phone number cannot be empty!').show();
            return;
        }

        if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            $('#error-message').text(isArabic ? 'الاسم موجود بالفعل!' : 'Name already exists!').show();
            return;
        }

        $('#error-message').hide();

        const newPerson = { name, phone, phone2 };
        const docRef = await addDoc(collection(window.db, "people"), newPerson);
        newPerson.id = docRef.id;

        people.push(newPerson);

        $('#person-form')[0].reset();
        loadPeopleList();
    });
}

function loadPeople() {
    $('#suggestions').html('<option value="" disabled selected>Select a person</option>');
    people.forEach(person => {
        $('#suggestions').append(`<option value="${person.id}">${person.name}</option>`);
    });

    $('#suggestions').change(function() {
        selectedPersonId = $(this).val();
        loadTransactions(selectedPersonId);
    });
}

async function loadTransactions(personId) {
    const transactionHistory = $('#transaction-history');
    transactionHistory.html('');
    let totalDebt = 0;
    const q = query(collection(window.db, "transactions"), where("personId", "==", personId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        if (!transactions[personId]) {
            transactions[personId] = [];
        }
        transactions[personId].push(transaction);
        const rowClass = transaction.amount < 0 ? 'bg-green-900' : 'bg-red-900';
        transactionHistory.append(`
            <tr class="${rowClass}">
                <td class="py-2 px-4">${transaction.id}</td>
                <td class="py-2 px-4">${transaction.description}</td>
                <td class="py-2 px-4">${formatNumber(transaction.amount)} IQD</td>
                <td class="py-2 px-4">${transaction.date}</td>
                <td class="py-2 px-4">${transaction.time}</td>
            </tr>
        `);
        totalDebt += transaction.amount;
    });

    $('#total-debt').text(`${formatNumber(totalDebt)} IQD`);
}

function loadPeopleList() {
    displayPeople(people);
}

function displayPeople(people) {
    const peopleList = $('#people-list');
    peopleList.html('');
    people.forEach((person, index) => {
        const li = $(`
            <tr class="mb-2 border p-2 rounded flex justify-between items-center flex-col sm:flex-row">
                <td class="py-2 px-4">${index + 1}</td>
                <td class="py-2 px-4 w-full sm:w-auto">${person.name}</td>
                <td class="py-2 px-4 w-full sm:w-auto">
                    <button class="bg-blue-500 text-white px-2 py-1 rounded info-button" data-id="${person.id}">${isArabic ? 'معلومات' : 'Info'}</button>
                </td>
            </tr>
        `);
        peopleList.append(li);
    });

    $('.info-button').off('click').on('click', function() {
        const personId = $(this).data('id');
        const person = people.find(p => p.id === personId);
        if (person) {
            $('#info-content').html(`
                <p>${isArabic ? 'الأسم' : 'Name'}: ${person.name}</p>
                <p>${isArabic ? 'رقم الهاتف' : 'Phone Number'}: ${person.phone}</p>
                <p>${isArabic ? 'رقم الهاتف الثاني' : 'Second Phone Number'}: ${person.phone2 || ''}</p>
            `);
            $('#edit-id').val(person.id);
            $('#edit-name').val(person.name);
            $('#edit-phone').val(person.phone);
            $('#edit-phone2').val(person.phone2);
            $('#infoPopup').removeClass('hidden');
        }
    });
}

async function savePersonEdit() {
    const personId = $('#edit-id').val();
    const newName = $('#edit-name').val().trim();
    const newPhone = $('#edit-phone').val().trim();
    const newPhone2 = $('#edit-phone2').val().trim();

    if (newName && newPhone && !people.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.id !== personId)) {
        const person = people.find(p => p.id === personId);
        if (person) {
            person.name = newName;
            person.phone = newPhone;
            person.phone2 = newPhone2;
            const personDoc = doc(window.db, "people", personId);
            await updateDoc(personDoc, { name: newName, phone: newPhone, phone2: newPhone2 });
            loadPeopleList();
        }
    } else {
        const person = people.find(p => p.id === personId);
        $('#edit-name').val(person.name);
        $('#edit-phone').val(person.phone);
        $('#edit-phone2').val(person.phone2);
    }
}

async function deletePerson() {
    try {
        await deleteDoc(doc(window.db, "people", personToDelete));
        people = people.filter(p => p.id !== personToDelete);
        delete transactions[personToDelete];
        loadPeopleList();
        personToDelete = null;
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

function generateTransactionId(personId) {
    const person = people.find(p => p.id === personId);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const index = transactions[personId] ? transactions[personId].length : 0;
    return `${convertArabicToEnglishInitial(person.name.charAt(0))}${date}${index}`;
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function convertArabicToEnglishInitial(char) {
    const map = {
        'أ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h',
        'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'dh', 'ط': 't', 'ظ': 'th', 'ع': 'a', 'غ': 'g', 'ف': 'f',
        'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
        'ي': 'y'
    };
    return map[char] || char;
}

function generatePdf(personId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const person = people.find(p => p.id === personId);
    if (!person) return;

    doc.addFont('fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');

    doc.setFontSize(16);
    doc.text(isArabic ? 'بيانات العميل' : 'Customer Data', 10, 10);
    doc.setFontSize(12);
    doc.text(`${isArabic ? 'معرف العميل' : 'Customer ID'}: ${person.id}`, 10, 20);
    doc.text(`${isArabic ? 'الاسم' : 'Name'}: ${person.name}`, 10, 30);
    doc.text(`${isArabic ? 'رقم الهاتف' : 'Phone Number'}: +964${person.phone}`, 10, 40);
    if (person.phone2) {
        doc.text(`${isArabic ? 'رقم الهاتف الثاني' : 'Second Phone Number'}: +964${person.phone2}`, 10, 50);
    }

    const tableData = transactions[person.id] ? transactions[person.id].map(t => [
        t.id, t.description, formatNumber(t.amount) + ' IQD', t.date, t.time
    ]) : [];

    const totalDebt = transactions[person.id] ? transactions[person.id].reduce((acc, t) => acc + t.amount, 0) : 0;

    doc.autoTable({
        head: [[isArabic ? 'معرف الحركة' : 'Transaction ID', isArabic ? 'الوصف' : 'Description', isArabic ? 'القيمة بالدينار العراقي' : 'Amount (IQD)', isArabic ? 'التاريخ' : 'Date', isArabic ? 'الوقت' : 'Time']],
        body: tableData,
        foot: [[isArabic ? 'المبلغ الكلي' : 'Total Debt', '', '', '', formatNumber(totalDebt) + ' IQD']],
        startY: person.phone2 ? 60 : 50
    });

    doc.save(`${person.name}_CustomerData.pdf`);
}

function loadTransactionHistoryPage() {
    const transactionHistoryContent = isArabic ? `
        <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-2xl mb-4 text-center text-white">تاريخ الحركات</h2>
            <button id="backBtn" class="bg-blue-500 text-white px-4 py-2 rounded mb-4">عودة</button>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">معرف الحركة</th>
                            <th class="py-2">الوصف</th>
                            <th class="py-2">القيمة بالدينار العراقي</th>
                            <th class="py-2">التاريخ</th>
                            <th class="py-2">الوقت</th>
                        </tr>
                    </thead>
                    <tbody id="transaction-history">
                        <!-- Transactions will be dynamically added here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="py-2" colspan="4">المبلغ الكلي</td>
                            <td class="py-2" id="total-debt"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    ` : `
        <div class="bg-gray-800 p-6 rounded shadow-md">
            <h2 class="text-2xl mb-4 text-center text-white">Transaction History</h2>
            <button id="backBtn" class="bg-blue-500 text-white px-4 py-2 rounded mb-4">Back</button>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-gray-800 text-center text-white">
                    <thead>
                        <tr>
                            <th class="py-2">Transaction ID</th>
                            <th class="py-2">Description</th>
                            <th class="py-2">Amount (IQD)</th>
                            <th class="py-2">Date</th>
                            <th class="py-2">Time</th>
                        </tr>
                    </thead>
                    <tbody id="transaction-history">
                        <!-- Transactions will be dynamically added here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="py-2" colspan="4">Total Debt</td>
                            <td class="py-2" id="total-debt"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    $('#content').html(transactionHistoryContent);

    $('#backBtn').click(function() {
        if (isDashboard) {
            loadDashboardPage();
        } else {
            loadHomePage();
        }
    });

    loadTransactions(selectedPersonId);
}
