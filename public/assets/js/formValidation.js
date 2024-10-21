// Function to validate student login form
function validateLoginForm() {
    const email = document.forms["studentLoginForm"]["email"].value;
    const password = document.forms["studentLoginForm"]["password"].value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex for email validation

    if (email === "" || password === "") {
        alert("Email and Password must be filled out");
        return false;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address");
        return false;
    }

    return true;
}

// Function to validate admin login form
function validateAdminLogin() {
    const username = document.forms["adminLoginForm"]["username"].value;
    const password = document.forms["adminLoginForm"]["password"].value;

    if (!username || !password) {
        alert("All fields must be filled out");
        return false;
    }

    return true;
}

// Function to validate student registration form
function validateRegisterForm() {
    const name = document.forms["studentRegisterForm"]["name"].value;
    const rollNumber = document.forms["studentRegisterForm"]["rollNumber"].value;
    const mobile = document.forms["studentRegisterForm"]["mobile"].value;
    const email = document.forms["studentRegisterForm"]["email"].value;
    const password = document.forms["studentRegisterForm"]["password"].value;
    const mobilePattern = /^[0-9]{10}$/; // Regex for 10-digit mobile numbers
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Email regex

    if (name === "" || rollNumber === "" || mobile === "" || email === "" || password === "") {
        alert("All fields must be filled out");
        return false;
    }

    if (!mobilePattern.test(mobile)) {
        alert("Please enter a valid 10-digit mobile number");
        return false;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address");
        return false;
    }

    return true;
}

// Function to validate admin registration form
function validateAdminRegistration() {
    const name = document.forms["adminRegisterForm"]["name"].value;
    const email = document.forms["adminRegisterForm"]["email"].value;
    const password = document.forms["adminRegisterForm"]["password"].value;
    const confirmPassword = document.forms["adminRegisterForm"]["confirm_password"].value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Email regex

    if (!name || !email || !password || !confirmPassword) {
        alert("All fields must be filled out");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return false;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address");
        return false;
    }

    // Add additional password strength validation if necessary
    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return false;
    }

    return true;
}
