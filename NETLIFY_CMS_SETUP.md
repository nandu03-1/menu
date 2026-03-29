# Netlify CMS Setup Instructions

## Introduction
Netlify CMS is an open-source content management system that works with static site generators, providing a user-friendly interface for managing content.

## Prerequisites
1. A GitHub account.
2. A static site hosted on Netlify.

## Step 1: Create a GitHub OAuth Application
1. Go to your GitHub account settings.
2. Navigate to **Developer settings** > **OAuth Apps**.
3. Click on **New OAuth App**.
4. Enter the following information:
   - **Application name**: Netlify CMS
   - **Homepage URL**: https://your-site-name.netlify.app
   - **Authorization callback URL**: https://your-site-name.netlify.app/___graphql
5. Click on **Register application**.
6. Note your **Client ID** and **Client Secret**.

## Step 2: Configure Netlify CMS
1. In your static site repository, create a folder named `admin`.
2. Inside the `admin` folder, create a file named `config.yml`.
3. Add the following configuration to `config.yml`:
   ```yaml
   backend:
     name: github
     repo: YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME
     branch: main
     auth:
       client_id: YOUR_CLIENT_ID
       client_secret: YOUR_CLIENT_SECRET
   media_folder: "static/images" # Path to the images folder
   public_folder: "images" # Path for accessing images
   collections:
     - name: "posts" # Name of the collection
       label: "Posts" # Label for the collection
       folder: "content/posts" # Path to your posts folder
       create: true
       slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Slug format
       fields:
         - { label: "Title", name: "title", widget: "string" }
         - { label: "Body", name: "body", widget: "markdown" }
   ```
4. Replace the placeholders with actual values:
   - `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME`: with your GitHub username and repository name.
   - `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET`: with the values from your GitHub OAuth App.

## Step 3: Accessing Netlify CMS
1. Deploy your repository on Netlify.
2. Visit `https://your-site-name.netlify.app/admin` to access the CMS.
3. Log in using your GitHub account.
4. You should now see your CMS interface, where you can create and edit content.

## Conclusion
You have successfully set up Netlify CMS for your website. Adjust the configuration as needed to suit your content management requirements.