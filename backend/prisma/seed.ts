import { PrismaClient, SkillCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create skills taxonomy
  const skills = [
    // Technology
    {
      name: "JavaScript",
      category: SkillCategory.TECHNOLOGY,
      description: "Programming language for web development",
    },
    {
      name: "Python",
      category: SkillCategory.TECHNOLOGY,
      description: "Versatile programming language",
    },
    {
      name: "React",
      category: SkillCategory.TECHNOLOGY,
      description: "JavaScript library for building user interfaces",
    },
    {
      name: "Node.js",
      category: SkillCategory.TECHNOLOGY,
      description: "JavaScript runtime for server-side development",
    },
    {
      name: "TypeScript",
      category: SkillCategory.TECHNOLOGY,
      description: "Typed superset of JavaScript",
    },
    {
      name: "SQL",
      category: SkillCategory.TECHNOLOGY,
      description: "Database query language",
    },
    {
      name: "Docker",
      category: SkillCategory.TECHNOLOGY,
      description: "Containerization platform",
    },
    {
      name: "AWS",
      category: SkillCategory.TECHNOLOGY,
      description: "Amazon Web Services cloud platform",
    },
    {
      name: "Machine Learning",
      category: SkillCategory.TECHNOLOGY,
      description: "AI and data science techniques",
    },
    {
      name: "Cybersecurity",
      category: SkillCategory.TECHNOLOGY,
      description: "Information security practices",
    },

    // Design
    {
      name: "UI/UX Design",
      category: SkillCategory.DESIGN,
      description: "User interface and experience design",
    },
    {
      name: "Figma",
      category: SkillCategory.DESIGN,
      description: "Collaborative design tool",
    },
    {
      name: "Adobe Photoshop",
      category: SkillCategory.DESIGN,
      description: "Image editing and manipulation",
    },
    {
      name: "Adobe Illustrator",
      category: SkillCategory.DESIGN,
      description: "Vector graphics design",
    },
    {
      name: "Graphic Design",
      category: SkillCategory.DESIGN,
      description: "Visual communication design",
    },
    {
      name: "Web Design",
      category: SkillCategory.DESIGN,
      description: "Website visual design",
    },
    {
      name: "Brand Design",
      category: SkillCategory.DESIGN,
      description: "Brand identity and visual systems",
    },
    {
      name: "Motion Graphics",
      category: SkillCategory.DESIGN,
      description: "Animated visual content",
    },

    // Business
    {
      name: "Project Management",
      category: SkillCategory.BUSINESS,
      description: "Planning and executing projects",
    },
    {
      name: "Business Strategy",
      category: SkillCategory.BUSINESS,
      description: "Strategic planning and analysis",
    },
    {
      name: "Financial Analysis",
      category: SkillCategory.BUSINESS,
      description: "Financial data interpretation",
    },
    {
      name: "Leadership",
      category: SkillCategory.BUSINESS,
      description: "Team management and guidance",
    },
    {
      name: "Entrepreneurship",
      category: SkillCategory.BUSINESS,
      description: "Starting and running businesses",
    },
    {
      name: "Sales",
      category: SkillCategory.BUSINESS,
      description: "Selling products and services",
    },
    {
      name: "Negotiation",
      category: SkillCategory.BUSINESS,
      description: "Deal-making and conflict resolution",
    },

    // Marketing
    {
      name: "Digital Marketing",
      category: SkillCategory.MARKETING,
      description: "Online marketing strategies",
    },
    {
      name: "Social Media Marketing",
      category: SkillCategory.MARKETING,
      description: "Social platform marketing",
    },
    {
      name: "Content Marketing",
      category: SkillCategory.MARKETING,
      description: "Content creation and strategy",
    },
    {
      name: "SEO",
      category: SkillCategory.MARKETING,
      description: "Search engine optimization",
    },
    {
      name: "Google Ads",
      category: SkillCategory.MARKETING,
      description: "Google advertising platform",
    },
    {
      name: "Email Marketing",
      category: SkillCategory.MARKETING,
      description: "Email campaign management",
    },
    {
      name: "Brand Marketing",
      category: SkillCategory.MARKETING,
      description: "Brand promotion and positioning",
    },

    // Languages
    {
      name: "English",
      category: SkillCategory.LANGUAGES,
      description: "English language proficiency",
    },
    {
      name: "Spanish",
      category: SkillCategory.LANGUAGES,
      description: "Spanish language proficiency",
    },
    {
      name: "French",
      category: SkillCategory.LANGUAGES,
      description: "French language proficiency",
    },
    {
      name: "German",
      category: SkillCategory.LANGUAGES,
      description: "German language proficiency",
    },
    {
      name: "Mandarin",
      category: SkillCategory.LANGUAGES,
      description: "Mandarin Chinese proficiency",
    },
    {
      name: "Japanese",
      category: SkillCategory.LANGUAGES,
      description: "Japanese language proficiency",
    },

    // Music
    {
      name: "Guitar",
      category: SkillCategory.MUSIC,
      description: "Guitar playing and techniques",
    },
    {
      name: "Piano",
      category: SkillCategory.MUSIC,
      description: "Piano playing and music theory",
    },
    {
      name: "Singing",
      category: SkillCategory.MUSIC,
      description: "Vocal techniques and performance",
    },
    {
      name: "Music Production",
      category: SkillCategory.MUSIC,
      description: "Audio recording and mixing",
    },
    {
      name: "Drums",
      category: SkillCategory.MUSIC,
      description: "Drum playing and rhythm",
    },

    // Arts & Crafts
    {
      name: "Drawing",
      category: SkillCategory.ARTS_CRAFTS,
      description: "Sketching and illustration techniques",
    },
    {
      name: "Painting",
      category: SkillCategory.ARTS_CRAFTS,
      description: "Various painting techniques",
    },
    {
      name: "Pottery",
      category: SkillCategory.ARTS_CRAFTS,
      description: "Ceramic arts and pottery making",
    },
    {
      name: "Knitting",
      category: SkillCategory.ARTS_CRAFTS,
      description: "Knitting patterns and techniques",
    },
    {
      name: "Woodworking",
      category: SkillCategory.ARTS_CRAFTS,
      description: "Wood crafting and carpentry",
    },

    // Fitness
    {
      name: "Yoga",
      category: SkillCategory.FITNESS,
      description: "Yoga poses and meditation",
    },
    {
      name: "Personal Training",
      category: SkillCategory.FITNESS,
      description: "Fitness coaching and exercise",
    },
    {
      name: "Running",
      category: SkillCategory.FITNESS,
      description: "Running techniques and training",
    },
    {
      name: "Weight Training",
      category: SkillCategory.FITNESS,
      description: "Strength training and bodybuilding",
    },
    {
      name: "Pilates",
      category: SkillCategory.FITNESS,
      description: "Pilates exercises and techniques",
    },

    // Cooking
    {
      name: "Italian Cooking",
      category: SkillCategory.COOKING,
      description: "Traditional Italian cuisine",
    },
    {
      name: "Baking",
      category: SkillCategory.COOKING,
      description: "Bread, pastries, and desserts",
    },
    {
      name: "Vegetarian Cooking",
      category: SkillCategory.COOKING,
      description: "Plant-based meal preparation",
    },
    {
      name: "Asian Cuisine",
      category: SkillCategory.COOKING,
      description: "Various Asian cooking styles",
    },
    {
      name: "Grilling",
      category: SkillCategory.COOKING,
      description: "BBQ and grilling techniques",
    },

    // Photography
    {
      name: "Portrait Photography",
      category: SkillCategory.PHOTOGRAPHY,
      description: "People and portrait techniques",
    },
    {
      name: "Landscape Photography",
      category: SkillCategory.PHOTOGRAPHY,
      description: "Nature and landscape shots",
    },
    {
      name: "Photo Editing",
      category: SkillCategory.PHOTOGRAPHY,
      description: "Post-processing and retouching",
    },
    {
      name: "Wedding Photography",
      category: SkillCategory.PHOTOGRAPHY,
      description: "Event and wedding photography",
    },

    // Writing
    {
      name: "Creative Writing",
      category: SkillCategory.WRITING,
      description: "Fiction and creative storytelling",
    },
    {
      name: "Technical Writing",
      category: SkillCategory.WRITING,
      description: "Documentation and technical content",
    },
    {
      name: "Copywriting",
      category: SkillCategory.WRITING,
      description: "Marketing and advertising copy",
    },
    {
      name: "Blogging",
      category: SkillCategory.WRITING,
      description: "Blog writing and content creation",
    },
  ];

  console.log("📚 Creating skills...");
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  // Create demo users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const demoUsers = [
    {
      email: "alex.teacher@skillsync.com",
      passwordHash: hashedPassword,
      firstName: "Alex",
      lastName: "Johnson",
      bio: "Full-stack developer with 8 years of experience. Love teaching React and Node.js!",
      location: "San Francisco, CA",
      timezone: "America/Los_Angeles",
      isVerified: true,
      rating: 4.8,
      totalSessions: 45,
      creditBalance: 250,
    },
    {
      email: "sarah.designer@skillsync.com",
      passwordHash: hashedPassword,
      firstName: "Sarah",
      lastName: "Chen",
      bio: "UX/UI designer passionate about creating beautiful and functional interfaces.",
      location: "New York, NY",
      timezone: "America/New_York",
      isVerified: true,
      rating: 4.9,
      totalSessions: 32,
      creditBalance: 180,
    },
    {
      email: "mike.learner@skillsync.com",
      passwordHash: hashedPassword,
      firstName: "Mike",
      lastName: "Rodriguez",
      bio: "Marketing professional looking to learn web development and design skills.",
      location: "Austin, TX",
      timezone: "America/Chicago",
      isVerified: false,
      rating: 4.5,
      totalSessions: 12,
      creditBalance: 75,
    },
    {
      email: "emma.multilingual@skillsync.com",
      passwordHash: hashedPassword,
      firstName: "Emma",
      lastName: "Williams",
      bio: "Polyglot and language teacher. Fluent in 5 languages and love helping others learn!",
      location: "London, UK",
      timezone: "Europe/London",
      isVerified: true,
      rating: 4.7,
      totalSessions: 67,
      creditBalance: 320,
    },
  ];

  console.log("👥 Creating demo users...");
  const createdUsers = [];
  for (const user of demoUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdUsers.push(createdUser);
  }

  // Add skills to demo users
  console.log("🎯 Adding skills to users...");

  // Alex - Full-stack developer
  const alexSkills = ["JavaScript", "React", "Node.js", "TypeScript", "SQL"];
  for (const skillName of alexSkills) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skill) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: createdUsers[0].id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: createdUsers[0].id,
          skillId: skill.id,
          proficiencyLevel: 85,
          canTeach: true,
          wantsToLearn: false,
          isVerified: true,
          verificationCount: 3,
        },
      });
    }
  }

  // Sarah - Designer
  const sarahSkills = [
    "UI/UX Design",
    "Figma",
    "Adobe Photoshop",
    "Graphic Design",
  ];
  for (const skillName of sarahSkills) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skill) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: createdUsers[1].id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: createdUsers[1].id,
          skillId: skill.id,
          proficiencyLevel: 90,
          canTeach: true,
          wantsToLearn: false,
          isVerified: true,
          verificationCount: 4,
        },
      });
    }
  }

  // Mike - Learner
  const mikeSkills = ["Digital Marketing", "Social Media Marketing"];
  const mikeWantsToLearn = ["JavaScript", "UI/UX Design"];

  for (const skillName of mikeSkills) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skill) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: createdUsers[2].id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: createdUsers[2].id,
          skillId: skill.id,
          proficiencyLevel: 70,
          canTeach: true,
          wantsToLearn: false,
        },
      });
    }
  }

  for (const skillName of mikeWantsToLearn) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skill) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: createdUsers[2].id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: createdUsers[2].id,
          skillId: skill.id,
          proficiencyLevel: 20,
          canTeach: false,
          wantsToLearn: true,
        },
      });
    }
  }

  // Emma - Language teacher
  const emmaSkills = ["English", "Spanish", "French", "German"];
  for (const skillName of emmaSkills) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skill) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: createdUsers[3].id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: createdUsers[3].id,
          skillId: skill.id,
          proficiencyLevel: 95,
          canTeach: true,
          wantsToLearn: false,
          isVerified: true,
          verificationCount: 5,
        },
      });
    }
  }

  // Add user preferences
  console.log("⚙️ Setting user preferences...");
  for (const user of createdUsers) {
    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        matchSuggestions: true,
        messageNotifications: true,
        creditNotifications: true,
        systemNotifications: true,
      },
    });
  }

  // Add some availability for users
  console.log("📅 Adding availability schedules...");
  const availabilityData = [
    // Alex - Available weekday evenings and weekends
    {
      userId: createdUsers[0].id,
      dayOfWeek: 1,
      startTime: "18:00",
      endTime: "22:00",
      timezone: "America/Los_Angeles",
    },
    {
      userId: createdUsers[0].id,
      dayOfWeek: 2,
      startTime: "18:00",
      endTime: "22:00",
      timezone: "America/Los_Angeles",
    },
    {
      userId: createdUsers[0].id,
      dayOfWeek: 6,
      startTime: "10:00",
      endTime: "18:00",
      timezone: "America/Los_Angeles",
    },
    {
      userId: createdUsers[0].id,
      dayOfWeek: 0,
      startTime: "10:00",
      endTime: "16:00",
      timezone: "America/Los_Angeles",
    },

    // Sarah - Available mornings and some evenings
    {
      userId: createdUsers[1].id,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
      timezone: "America/New_York",
    },
    {
      userId: createdUsers[1].id,
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "12:00",
      timezone: "America/New_York",
    },
    {
      userId: createdUsers[1].id,
      dayOfWeek: 5,
      startTime: "19:00",
      endTime: "21:00",
      timezone: "America/New_York",
    },

    // Emma - Flexible schedule
    {
      userId: createdUsers[3].id,
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "20:00",
      timezone: "Europe/London",
    },
    {
      userId: createdUsers[3].id,
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "20:00",
      timezone: "Europe/London",
    },
    {
      userId: createdUsers[3].id,
      dayOfWeek: 4,
      startTime: "14:00",
      endTime: "20:00",
      timezone: "Europe/London",
    },
    {
      userId: createdUsers[3].id,
      dayOfWeek: 6,
      startTime: "10:00",
      endTime: "16:00",
      timezone: "Europe/London",
    },
  ];

  for (const availability of availabilityData) {
    await prisma.availability.create({
      data: availability,
    });
  }

  // Add some sample credit transactions
  console.log("💰 Adding credit transactions...");
  const transactions = [
    {
      userId: createdUsers[0].id,
      type: "EARNED",
      amount: 50,
      description: "Completed React session with Mike",
    },
    {
      userId: createdUsers[0].id,
      type: "EARNED",
      amount: 30,
      description: "Completed JavaScript session",
    },
    {
      userId: createdUsers[1].id,
      type: "EARNED",
      amount: 40,
      description: "Completed UI/UX Design session",
    },
    {
      userId: createdUsers[2].id,
      type: "SPENT",
      amount: -50,
      description: "Booked React session with Alex",
    },
    {
      userId: createdUsers[2].id,
      type: "PURCHASED",
      amount: 100,
      description: "Purchased credit package",
    },
    {
      userId: createdUsers[3].id,
      type: "EARNED",
      amount: 35,
      description: "Completed Spanish lesson",
    },
  ];

  for (const transaction of transactions) {
    await prisma.creditTransaction.create({
      data: transaction,
    });
  }

  console.log("✅ Database seed completed successfully!");
  console.log(`📊 Created:`);
  console.log(
    `   - ${skills.length} skills across ${
      Object.keys(SkillCategory).length
    } categories`
  );
  console.log(`   - ${demoUsers.length} demo users with profiles`);
  console.log(`   - User skills and availability schedules`);
  console.log(`   - Sample credit transactions`);
  console.log(`   - User preferences`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
