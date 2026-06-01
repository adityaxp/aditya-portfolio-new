import {
  lawSage,
  lawSageHover,
  p2pChat,
  p2pChatHover,
  raspiCarV2,
  raspiCarV2Hover,
  ravenUAV,
  ravenUAVHover,
} from "../../assets";

export const siteConfig = {
  name: "Aditya Balsane",
  title: "Aditya Balsane",
  description:
    "Crafting digital experiences through precision design and thoughtful engineering.",
  url: "https://www.adityabalsane.com",
  email: "adityabalsane.devmail@gmail.com",
  socials: {
    github: "https://github.com/adityaxp",
    linkedin: "https://www.linkedin.com/in/adityabalsane/",
    huggingface: "https://huggingface.co/AdityaXPV",
  },
  cv: "https://firebasestorage.googleapis.com/v0/b/portfolio-assets-ba601.appspot.com/o/CV%2FCV-Aditya_Balsane_%2B917219316256.pdf?alt=media&token=dab22968-ad47-457d-93be-776b4264fac4",
  keywords: [
    "Aditya Balsane",
    "software engineer",
    "mobile developer",
    "React Native",
    "React",
    "Next.js",
    "TypeScript",
    "embedded systems",
    "Raspberry Pi",
    "LLM",
    "portfolio",
    "LawSage",
    "RavenUAV",
    "RaspiCarV2",
    "WebRTC",
    "Kotlin",
    "Android",
  ],
} as const;

export const navLinks = [
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
] as const;

export const experiences = [
  {
    role: "Software Engineer",
    company: "One800",
    location: "Bengaluru, Karnataka",
    period: "Sept 2024 — Present",
    description: [
      "Led development of a customer-facing platform serving **50K+ users** across web and mobile, delivering a seamless repair booking experience.",
      "Built and shipped a **complete mobile repair lifecycle system**, including **order booking**, real-time **device tracking (map-based)** secure trip service, **live repair streaming**, technician-customer interaction, **payment integration**, and **customer support workflows**.",
      "Built a **service centre operations app** with role-based access for technicians and operations teams to **manage repairs**, **handle customer communication**, and **process warranty claims**, significantly improving **turnaround time**.",
      "Developed native **iOS and Android** diagnostic applications, improving **QA workflows** and reducing **QC failures** by **30–40%**.",
      "Collaborated on backend systems including real-time updates using **SSE**, secure credential storage (**password vault**), and infrastructure supporting **live repair** streaming.",
    ],
    technologies: [
      "JavaScript",
      "TypeScript",
      "Kotlin",
      "Java",
      "Swift UI",
      "React Native",
      "React",
      "Next.js",
      "Express",
      "Jetpack Compose",
      "Expo",
      "Posthog",
      "Openobserve",
      "Zustand",
      "MMKV",
    ],
  },
  {
    role: "React Native Developer",
    company: "Stealth Startup ",
    location: "Missouri, United States · Remote",
    period: "Nov 2023 — Aug 2024",
    description: [
      "Built an **end-to-end mobile application** for receiving and processing data from **healthcare devices**, including **report insights**, **test history**, and **diagnostic workflows**.",
      "Implemented interactive **data visualization features** (graphs and charts) to present **report metrics**, along with export functionality for generating detailed reports.",
      "Developed a **middleware layer** to enable seamless communication between mobile applications and **healthcare devices (including BLE/IoT integrations)**, improving data synchronization reliability and **reducing latency** in data transmission.",
    ],
    technologies: [
      "TypeScript",
      "React Native",
      "BLE (Bluetooth Low Energy)",
      "Node.js",
      "Express",
      "REST APIs",
      "WebSockets",
      "SQLite",
      "Data Visualization",
    ],
  },
  {
    role: "Android App Developer Intern",
    company: "SecqurAIse Technologies",
    location: "Chennai, Tamil Nadu, India · Remote",
    period: "Mar 2023 — Jul 2023",
    description: [
      "Led development of a **surveillance application**, working across **UI**, **backend services**, and **alerting systems** for real-time monitoring.",
      "Designed and implemented **APIs for high-frequency** real-time data retrieval from edge systems, integrating them into the app with filterable views to improve data accessibility and reduce response time to critical alerts.",
      "Built features to process and display **real-time alert data and live video feeds**, and implemented an incident resolution workflow with **push notifications (FCM)** to ensure timely updates and faster response handling.",
    ],
    technologies: [
      "Java",
      "Kotlin",
      "XML",
      "Firebase",
      "WebSockets",
      "Video Streaming (HLS)",
      "Push Notifications (FCM)",
    ],
  },
  {
    role: "Research and Development Intern",
    company: "KKWIER",
    location: "Nasik, Maharashtra, India",
    period: "Feb 2023 — Mar 2023",
    description: [
      "Devised an algorithm for estimating a person's **height** and **body posture**, which was then put into action through the utilization of diverse image processing techniques within **OpenCV** and **MediaPipe**. Designed end-user applications using **PYQT5** and **Android SDK** for mobile platform.",
    ],
    technologies: ["Python", "OpenCV", "MediaPipe", "PYQT5", "Android SDK"],
  },
] as const;

export const projects = [
  {
    title: "RavenUAV",
    category: "UAV, AI agents & App Development",
    description:
      "RavenUAV is an autonomous drone platform powered by AI agents, leveraging a Pixhawk flight controller and a Raspberry Pi companion computer for intelligent autonomous flight.",
    image: ravenUAV,
    imageHover: ravenUAVHover,
    link: "",
  },
  {
    title: "LawSage",
    category: "LLM & App Development",
    description:
      "Lawsage is a legal advisory platform powered by LLM, featuring various models fine-tuned on Indian laws, regulations, relevant articles, legal advice forum threads, and other legal texts. It includes a Retrieval-Augmented Generation (RAG) based chat interface that uses a dataset comprising the Indian Constitution, Central Acts, and State Acts legislation. This dataset, compiled into a text corpus and stored as vector embeddings, serves as the underlying context for generating responses.",
    image: lawSage,
    imageHover: lawSageHover,
    link: "https://github.com/adityaxp/LawSageApp",
  },
  {
    title: "Node p2p Chat",
    category: "App Development",
    description:
      "Real-time peer-to-peer chat application featuring end-to-end encryption, WebRTC, and BLE. Built with Expo + React Native.",
    image: p2pChat,
    imageHover: p2pChatHover,
    link: "https://github.com/adityaxp/secure-chat",
  },
  {
    title: "RaspiCarV2",
    category: "Embedded Systems & App Development",
    description:
      "The RaspiCarV2, powered by Raspberry Pi 3B+ and integrated with Firebase for cloud-based remote control, is a surveillance car prototype.",
    image: raspiCarV2,
    imageHover: raspiCarV2Hover,
    link: "https://github.com/adityaxp/RaspiCarV2",
  },
] as const;
