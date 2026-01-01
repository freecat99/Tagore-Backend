import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

// Fix for finding .env when running script from different folders
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import Models (Go up one level "../")
import User from "../Models/userModel.js";
import Project from "../Models/projectModel.js";

// --- DEMO DATA ---
const DEMO_USER = {
  fullName: "Dr. Pratham Demo",
  email: "demo@research.com",
  password: "password123", 
  role: "Researcher",
  profilePic: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
  headline: "Lead Researcher at OpenScience",
  bio: "Dedicated to democratizing scientific funding and accelerating breakthroughs in sustainability and AI.",
  institution: "Tagore Institute",
  location: "New Delhi, India"
};

const SAMPLE_PROJECTS = [
  {
    title: "CRISPR-Cas9 Gene Editing for Drought-Resistant Wheat",
    category: "Biotech",
    abstract: "Developing a novel gene-editing protocol to suppress the Sal1 gene in Triticum aestivum. This research aims to increase crop yield by 40% in semi-arid regions without requiring additional water irrigation.",
    content: "Full academic paper content would go here...",
    fundingGoal: 120000,
    amountRaised: 45000,
    tags: ["Genetics", "Agriculture", "CRISPR"],
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Mitigating Hallucination in Large Language Models via RAG",
    category: "Artificial Intelligence",
    abstract: "A comparative study of Retrieval-Augmented Generation (RAG) versus Fine-Tuning for reducing factual errors in medical diagnosis AI. Introducing 'Truth-Vector', a new metric for evaluating model honesty.",
    content: "Abstract: Large Language Models (LLMs) often suffer from hallucinations...",
    fundingGoal: 100000,
    amountRaised: 82000,
    tags: ["AI Safety", "NLP", "Machine Learning"],
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Solid-State Battery Electrolytes: The Lithium-Sulfur Breakthrough",
    category: "Clean Energy",
    abstract: "Synthesizing a ceramic-polymer composite electrolyte that stabilizes the lithium anode interface. This aims to double the energy density of EV batteries while eliminating fire risks associated with liquid electrolytes.",
    content: "Introduction: The demand for high-energy-density storage...",
    fundingGoal: 500000,
    amountRaised: 150000,
    tags: ["Batteries", "EV", "Materials Science"],
    imageUrl: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Non-Invasive Brain-Computer Interfaces using Ultrasound",
    category: "Neuroscience",
    abstract: "Moving beyond EEG: Using high-frequency focused ultrasound to detect neural spiking activity with sub-millimeter precision through the skull, enabling thought-controlled prosthetics without surgery.",
    content: "Methodology: We utilize a custom transducer array...",
    fundingGoal: 80000,
    amountRaised: 12000,
    tags: ["BCI", "Healthcare", "Ultrasound"],
    imageUrl: "https://images.unsplash.com/photo-1559757175-0b314e9bf74b?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Bio-Inspired Filtration for Microplastic Removal",
    category: "Environment",
    abstract: "Modeling a filtration system based on the gill structure of Manta Rays. This passive system allows water to flow freely while trapping 99% of microplastics down to 5 microns in size.",
    content: "Results: Field trials in the Pacific Ocean showed...",
    fundingGoal: 30000,
    amountRaised: 28000,
    tags: ["Ocean Cleanup", "Biomimicry", "Sustainability"],
    imageUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Dark Matter Detection via Quantum Superconducting Sensors",
    category: "Astrophysics",
    abstract: "Utilizing superconducting qubits to detect single-photon interactions in a supercooled vacuum. This experiment seeks to prove the existence of axions as a candidate for Dark Matter particles.",
    content: "Hypothesis: Axions interact with electromagnetic fields...",
    fundingGoal: 1000000,
    amountRaised: 200000,
    tags: ["Quantum Physics", "Space", "Dark Matter"],
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1000"
  }
];

// --- THE SEED LOGIC ---
const seedDB = async () => {
  try {
    console.log("⏳ Connecting to DB...");
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file!");
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 Connected to MongoDB.");

    // 1. Wipe Data
    await User.deleteMany({});
    await Project.deleteMany({});
    console.log("🧹 Wiped old data.");

    // 2. Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, salt);
    
    const user = await User.create({
      ...DEMO_USER,
      password: hashedPassword
    });
    console.log(`👤 Created User: ${user.fullName}`);

    // 3. Create Projects
    const projectsWithAuthor = SAMPLE_PROJECTS.map(project => ({
      ...project,
      author: user._id,
      researcherName: user.fullName,
      description: project.abstract,
      institution: user.institution,
      isFundable: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }));

    await Project.insertMany(projectsWithAuthor);
    console.log(`🚀 Successfully seeded ${projectsWithAuthor.length} projects!`);

    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();