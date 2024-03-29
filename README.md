# Portfolio platform

This is a web application for managing user projects and displaying random facts.

## Features

- **User Authentication:** Users can sign up, log in, and log out.
- **Project Management:** Users can create, view, and delete their projects.
- **Random Facts:** The application displays a random fact on the user's account page.
  
## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Session-based authentication using Express Session
- **Random Fact API:** Utilizes an external API to fetch random facts
- **Deployment:** Hosted on a platform like Heroku
  
## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/project-name.git
    ```

2. Install dependencies:

    ```bash
    cd project-name
    npm install
    ```

3. Set up environment variables:
   
    - Create a `.env` file in the root directory
    - Add the necessary environment variables (e.g., database connection URI, API keys)

4. Run the application:

    ```bash
    node app.js
    ```

5. Access the application at `http://localhost:3000` in your web browser.

## Usage

1. Sign up for a new account or log in with existing credentials.
2. Create new projects or view/delete existing projects on your account page.
3. Explore random facts displayed on your account page.

