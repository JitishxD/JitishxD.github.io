/* ==========================================================================
   data.js — ALL site content lives here. Edit this file to update the site.
   Links set to "#" are hidden automatically until you add a real URL.
   ========================================================================== */
window.App = window.App || {};

App.data = {
    profile: {
        name: "Jitesh Goyal",
        alias: "Jitish",
        email: "Jitish08@gmail.com",
        phone: "+91-8890542635",
        showPhone: false, // set true to show your number publicly in Contact
        location: "Jaipur, Rajasthan, India",
        resume: "assets/Jitesh_Goyal_Resume.pdf",
        photo: "assets/profile.jpg",
    },

    socials: [
        { label: "GitHub", url: "https://github.com/JitishxD", icon: "github" },
        { label: "LinkedIn", url: "https://linkedin.com/in/jitish", icon: "linkedin" },
        { label: "Email", url: "mailto:Jitish08@gmail.com", icon: "mail" },
    ],

    about: {
        paragraphs: [
            "I'm a 3rd-year Integrated M.Tech (Cyber Security) student at VIT Bhopal. I build full-stack web apps with React, Node.js and MongoDB/PostgreSQL.",
            "My security background shapes how I build. JWT access/refresh rotation, HTTP-only cookies, rate limiting and timing-safe comparisons are things I plan from the start, not things I add later.",
            "At GDG on Campus VIT Bhopal I helped ship the club website, the Advitya'26 microsite and a real-time leaderboard. I've also solved 300+ competitive programming problems across different platforms.",
        ],
        meta: [
            { icon: "pin", text: "Jaipur, Rajasthan" },
            { icon: "grad", text: "VIT Bhopal · 2024–2029" },
            { icon: "briefcase", text: "Open to internships" },
        ],
    },

    stats: [
        { value: 300, suffix: "+", label: "Problems solved" },
        { value: 150, suffix: "+", label: "Day LeetCode streak" },
        { value: 8.05, decimals: 2, label: "CGPA" },
        { value: 1000, suffix: "+", label: "Commits on GitHub" },
    ],

    skills: [
        { title: "Languages", icon: "code", items: ["C/C++", "Java", "Python", "JavaScript", "SQL", "HTML", "CSS"] },
        { title: "Frameworks", icon: "layers", items: ["React.js", "Node.js", "Express.js", "Tailwind CSS"] },
        { title: "Technologies", icon: "cpu", items: ["REST APIs", "JWT", "bcrypt", "Full-Stack Development"] },
        { title: "Databases", icon: "database", items: ["MongoDB", "PostgreSQL"] },
        { title: "Tools & Platforms", icon: "tool", items: ["Docker", "Linux", "Git", "GitHub", "Figma", "Postman", "Firebase", "Vercel"] },
    ],

    marquee: [
        ["React", "Node.js", "Express", "MongoDB", "PostgreSQL", "Tailwind", "JavaScript", "C++"],
        ["JWT", "REST APIs", "Docker", "Linux", "Firebase", "Vercel", "Figma", "Postman"],
    ],

    timeline: [
        {
            type: "Experience", icon: "briefcase", period: "Dec 2025 — Sep 2026",
            title: "Technical Team Member",
            org: "Google Developer Groups on Campus, VIT Bhopal", location: "Bhopal",
            points: [
                "<strong>Club website:</strong> Worked in a team to ship the official GDGC VIT Bhopal website, a 9-route React SPA with responsive layouts, deployed on Vercel.",
                "<strong>Advitya'26 microsite:</strong> Built it end to end, including the parallax landing page, countdown timer and 3D gallery, using React 19, Framer Motion and GSAP.",
                "<strong>Real-time leaderboard:</strong> Co-developed a leaderboard that tracked 20+ teams using Firestore onSnapshot listeners, so scores updated live without refreshing the page.",
            ],
            chips: ["React 19", "Framer Motion", "GSAP", "Firebase", "Vercel"],
        },
        {
            type: "Education", icon: "grad", period: "2024 — 2029",
            title: "Integrated M.Tech, CSE (Cyber Security)",
            org: "Vellore Institute of Technology", location: "Bhopal",
            points: ["CGPA: <strong>8.05</strong>"],
            chips: ["Data Structures & Algorithms", "OOP", "DBMS", "Operating Systems"],
        },
    ],

    // Replace "#" with real URLs; links left as "#" are hidden automatically.
    projects: [
        {
            title: "DSA Practice Platform", tagline: "Competitive programming workspace",
            type: "Full-Stack", period: "Jul 2026 — Present", short: "DSA",
            image: "assets/projects/dsa-platform.jpg",
            stack: ["React 19", "Node.js", "Express 5", "MongoDB", "JWT", "Tailwind", "Vite"],
            points: [
                "<strong>Performance:</strong> Codeforces catalog loads went from multi-second cold fetches to CDN edge hits (2h fresh / 6h stale-while-revalidate). This came from separate Vercel-CDN and browser Cache-Control headers, turning off Express's auto-ETags, and an in-memory LRU cache.",
                "<strong>Security:</strong> JWT access/refresh rotation in HTTP-only cookies, timing-safe admin-secret comparison, slug-validated routes, rate limiting and secret checks at boot.",
                "<strong>Data & sync:</strong> 94 patterns across flat and nested sheets share one progress record. A sync pipeline checks the Codeforces problemset against contest standings and retries failed contests after a 1-hour cooldown.",
            ],
            links: [{ label: "Live demo", url: "https://jworkk.vercel.app/", icon: "external" }],
        },
        {
            title: "LevelUpSecurity", tagline: "Cybersecurity education platform",
            type: "Full-Stack", period: "Sep — Nov 2025", short: "LUS",
            image: "assets/projects/levelupsecurity.jpg",
            stack: ["React 19", "Node.js", "Express 5", "MongoDB", "JWT", "Tailwind", "Vite"],
            points: [
                "<strong>Architecture:</strong> 7 routes and 3 role-based training paths that give Developers, Marketers and Students threat content made for their role.",
                "<strong>Backend API:</strong> A RESTful Express 5 API with JWT in HTTP-only secure cookies and bcryptjs hashing. It has signup, login and logout endpoints and restores the session on page reload.",
                "<strong>Deployment:</strong> The Vite frontend and Express backend run together on Vercel with /api rewrites, so everything is served from one origin and CORS isn't needed.",
            ],
            links: [
                { label: "GitHub", url: "https://github.com/JitishxD/LevelUpSecurity", icon: "github" },
                { label: "Live demo", url: "https://level-up-security.vercel.app/", icon: "external" },
            ],
        },
        {
            title: "GDGC VIT Bhopal Website", tagline: "Official club website",
            type: "Team project", period: "GDGC", short: "GDGC",
            image: "assets/projects/gdgc-website.jpg",
            stack: ["React", "Responsive UI", "Vercel"],
            points: [
                "<strong>Scope:</strong> A 9-route React single-page app with responsive layouts on every page.",
                "<strong>Delivery:</strong> Built with the GDGC technical team and deployed on Vercel.",
            ],
            links: [{ label: "Live site", url: "https://gdgvitbhopal.vercel.app/", icon: "external" }],
        },
        {
            title: "Advitya'26 Microsite", tagline: "Tech-fest site + real-time leaderboard",
            type: "Event", period: "Advitya'26", short: "ADV",
            image: "assets/projects/advitya.jpg",
            stack: ["React 19", "Framer Motion", "GSAP", "Firebase Firestore"],
            points: [
                "<strong>Microsite:</strong> Built end to end, with a parallax landing page, countdown timer, 3D gallery and more.",
                "<strong>Leaderboard:</strong> Tracked 20+ competing teams with Firestore onSnapshot listeners, so scores updated live without refreshing the page.",
            ],
            links: [{ label: "Live site", url: "#", icon: "external" }],
        },
    ],

    achievements: [
        {
            type: "Achievement", period: "Ongoing", icon: "trophy", title: "300+ LeetCode problems", org: "LeetCode",
            desc: "Problems solved across arrays, graphs and dynamic programming, with a daily streak of 150+ days.", link: { label: "Profile", url: "#" }
        },
        {
            type: "Achievement", period: "Completed", icon: "award", title: "160 Days DSA Challenge", org: "GeeksForGeeks",
            desc: "Completed the 160 Days DSA Challenge in C++, covering algorithms and data structures.", link: { label: "Profile", url: "#" }
        },
        {
            type: "Training", period: "May — Aug 2026", icon: "network", title: "Cisco CCNA (200-301) Training", org: "NetworkChuck Academy · Jeremy Cioara · Chuck Keith",
            desc: "Training in networking fundamentals for the CCNA 200-301 exam."
        },
        {
            type: "Certification", period: "Jul 2026", icon: "grad", title: "The Bits and Bytes of Computer Networking", org: "Google IT Support Professional Certificate · Coursera",
            desc: "Networking concepts, from the layers of the network model to the protocols that connect everything."
        },
        {
            type: "Certification", period: "Dec 2025", icon: "book", title: "Mastering Data Structures & Algorithms using C and C++", org: "Udemy · Dr. Abdul Bari",
            desc: "Detailed coverage of data structures and algorithms implemented in C and C++."
        },
    ],

    resumeFacts: [
        ["Degree", "Integrated M.Tech CSE (Cyber Security)"],
        ["University", "VIT Bhopal"],
        ["Graduation", "2029 · CGPA 8.05"],
        ["Based in", "Jaipur, Rajasthan"],
        ["Seeking", "SWE / Full-Stack internships"],
    ],
};