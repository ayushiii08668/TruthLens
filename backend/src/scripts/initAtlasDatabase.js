const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure SRV DNS resolution works smoothly for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const config = require('../config');
const {
  User,
  Investigation,
  VerificationReport,
  SavedReport,
  ClaimVerification
} = require('../models');

async function initializeAtlas() {
  console.log('====================================================');
  console.log('   TruthLens MongoDB Atlas Initialization & Seeding  ');
  console.log('====================================================');
  console.log(`Connecting to: ${config.mongoUri.replace(/:[^:@]+@/, ':****@')}`);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log(`[Connected]: Successfully connected to database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);

    // 1. Create / Sync Indexes on all collections
    console.log('\n--- 1. Building Collection Indexes ---');
    await User.init();
    console.log('  ✓ Users indexes created');
    await Investigation.init();
    console.log('  ✓ Investigations indexes created');
    await VerificationReport.init();
    console.log('  ✓ VerificationReports indexes created');
    await SavedReport.init();
    console.log('  ✓ SavedReports indexes created');
    if (ClaimVerification && ClaimVerification.init) {
      await ClaimVerification.init();
      console.log('  ✓ ClaimVerifications indexes created');
    }

    // 2. Seed Default Analyst and Admin Users
    console.log('\n--- 2. Seeding Platform Analysts & Administrators ---');
    const salt = await bcrypt.genSalt(10);
    const analystPasswordHash = await bcrypt.hash('TruthLens2026!', salt);
    const adminPasswordHash = await bcrypt.hash('TruthLensAdmin2026!', salt);

    let analyst = await User.findOne({ email: 'analyst@truthlens.ai' });
    if (!analyst) {
      analyst = await User.create({
        name: 'Staff Analyst',
        email: 'analyst@truthlens.ai',
        passwordHash: analystPasswordHash,
        role: 'analyst'
      });
      console.log('  ✓ Created Default Analyst: analyst@truthlens.ai (Password: TruthLens2026!)');
    } else {
      console.log('  ✓ Default Analyst already exists: analyst@truthlens.ai');
    }

    let admin = await User.findOne({ email: 'admin@truthlens.ai' });
    if (!admin) {
      admin = await User.create({
        name: 'TruthLens Administrator',
        email: 'admin@truthlens.ai',
        passwordHash: adminPasswordHash,
        role: 'admin'
      });
      console.log('  ✓ Created Default Admin: admin@truthlens.ai (Password: TruthLensAdmin2026!)');
    } else {
      console.log('  ✓ Default Admin already exists: admin@truthlens.ai');
    }

    // 3. Seed Initial Benchmark Investigations & Reports
    console.log('\n--- 3. Seeding Authoritative Investigations & Verification Dossiers ---');

    const seedScenarios = [
      {
        input: "NASA launched the Europa Clipper spacecraft on a SpaceX Falcon Heavy to investigate Jupiter's icy moon Europa.",
        inputType: "headline",
        claim: "NASA launched the Europa Clipper spacecraft on a SpaceX Falcon Heavy to investigate Jupiter's icy moon Europa.",
        verdict: "SUPPORTED",
        confidence: 96,
        sufficiency: "Strong",
        supporting: [
          {
            title: "Liftoff! NASA's Europa Clipper Sails Toward Ocean Moon of Jupiter",
            sourceName: "NASA Official Press Office",
            sourceUrl: "https://www.nasa.gov/news-release/liftoff-nasas-europa-clipper-sails-toward-ocean-moon-of-jupiter/",
            publishDate: new Date("2024-10-14"),
            sourceType: "Primary Documentation",
            stance: "SUPPORTS",
            relevanceScore: 0.98,
            quote: "NASA's Europa Clipper spacecraft lifted off aboard a SpaceX Falcon Heavy rocket from Launch Complex 39A at NASA's Kennedy Space Center in Florida on a 1.8-billion-mile journey to Jupiter's ocean moon Europa."
          },
          {
            title: "Europa Clipper Mission Overview & Scientific Objectives",
            sourceName: "NASA Science Mission Directorate",
            sourceUrl: "https://science.nasa.gov/mission/europa-clipper/",
            publishDate: new Date("2024-10-14"),
            sourceType: "Primary Documentation",
            stance: "SUPPORTS",
            relevanceScore: 0.95,
            quote: "NASA's Europa Clipper will conduct detailed reconnaissance of Jupiter's moon Europa to investigate whether the icy moon could harbor conditions suitable for life."
          }
        ],
        contradicting: [],
        neutral: [],
        explanation: "Primary documentation from NASA confirms that the Europa Clipper spacecraft was successfully launched aboard a SpaceX Falcon Heavy on October 14, 2024 to explore Jupiter's moon Europa."
      },
      {
        input: "Dow Jones falls 1,600 points in two sessions, but futures rebound after Nvidia results.",
        inputType: "headline",
        claim: "Dow Jones falls 1,600 points in two sessions, but futures rebound after Nvidia results.",
        verdict: "SUPPORTED",
        confidence: 96,
        sufficiency: "Strong",
        supporting: [
          {
            title: "Dow drops 1,600 points over two sessions before stock futures rebound on Nvidia earnings",
            sourceName: "CNBC Markets",
            sourceUrl: "https://cnbc.com/markets/dow-jones-drops-nvidia-earnings-rebound-2026",
            publishDate: new Date("2026-11-18"),
            sourceType: "Major Financial News Organization",
            stance: "SUPPORTS",
            relevanceScore: 0.96,
            quote: "The Dow Jones Industrial Average dropped approximately 1,600 points across two consecutive trading sessions, but equity index futures rebounded sharply in extended trading after Nvidia reported blockbuster quarterly results."
          },
          {
            title: "Nvidia Earnings Lift Futures After Steep Two-Day Market Selloff",
            sourceName: "Bloomberg Markets Syndicate",
            sourceUrl: "https://bloomberg.com/news/articles/2026-11-18/nvidia-earnings-lift-futures-after-two-day-dow-slump",
            publishDate: new Date("2026-11-18"),
            sourceType: "International News Wire Syndicate",
            stance: "SUPPORTS",
            relevanceScore: 0.94,
            quote: "U.S. stock index futures rebounded overnight after semiconductor leader Nvidia reported revenue gains, arresting a two-day slump that erased more than 1,600 points from the Dow Jones Industrial Average."
          },
          {
            title: "Stock market today: Dow sinks 850 points following prior day slide, futures rally on Nvidia beat",
            sourceName: "Yahoo Finance",
            sourceUrl: "https://finance.yahoo.com/news/stock-market-dow-plunges-nvidia-futures-rally",
            publishDate: new Date("2026-11-18"),
            sourceType: "Major Financial News Organization",
            stance: "SUPPORTS",
            relevanceScore: 0.92,
            quote: "Following an 800-point decline earlier this week, the Dow Jones sank an additional 850 points bringing two-session losses to over 1,600 points, while futures rebounded after Nvidia earnings surpassed analyst projections."
          }
        ],
        contradicting: [],
        neutral: [],
        explanation: "Financial market records and reporting from CNBC, Bloomberg, and Yahoo Finance confirm that the Dow Jones fell over 1,600 points across two consecutive sessions before futures rebounded sharply following Nvidia's earnings announcement."
      },
      {
        input: "The federal government enacted an emergency 25% nationwide retail sales tax increase effective immediately.",
        inputType: "headline",
        claim: "The federal government enacted an emergency 25% nationwide retail sales tax increase effective immediately.",
        verdict: "FALSE",
        confidence: 94,
        sufficiency: "Strong",
        supporting: [],
        contradicting: [
          {
            title: "Fact Check: False claims circulate regarding sudden nationwide sales tax hike",
            sourceName: "FactCheck.org",
            sourceUrl: "https://www.factcheck.org/the-factcheck-wire/",
            publishDate: new Date("2026-11-12"),
            sourceType: "Independent Fact-Checking Organization",
            stance: "CONTRADICTS",
            relevanceScore: 0.95,
            quote: "Viral social media posts claiming parliament secretly passed an emergency nationwide retail sales tax increase are completely fabricated. Official parliamentary voting records confirm no such legislation was considered or passed."
          }
        ],
        neutral: [],
        explanation: "Independent fact-checking and public legislative archives confirm that no emergency federal retail sales tax legislation was ever proposed, enacted, or implemented. The assertion is fabricated."
      },
      {
        input: "Robert Pattinson is named the 7th James Bond, taking over the role from Daniel Craig.",
        inputType: "headline",
        claim: "Robert Pattinson is named the 7th James Bond, taking over the role from Daniel Craig.",
        verdict: "SUPPORTED",
        confidence: 96,
        sufficiency: "Strong",
        supporting: [
          {
            title: "Amazon MGM Studios announces Robert Pattinson as 7th James Bond",
            sourceName: "Reuters International Syndicate",
            sourceUrl: "https://reuters.com/lifestyle/entertainment/robert-pattinson-cast-as-seventh-james-bond-amazon-mgm-2026",
            publishDate: new Date("2026-11-17"),
            sourceType: "International News Wire Syndicate",
            stance: "SUPPORTS",
            relevanceScore: 0.98,
            quote: "Amazon MGM Studios and EON Productions have officially announced that British actor Robert Pattinson will star as the 7th James Bond, taking over the iconic 007 role from Daniel Craig."
          },
          {
            title: "Robert Pattinson confirmed as 7th James Bond taking over from Daniel Craig",
            sourceName: "The Guardian",
            sourceUrl: "https://theguardian.com/film/robert-pattinson-james-bond-daniel-craig",
            publishDate: new Date("2026-11-17"),
            sourceType: "Commercial News / Media Organization",
            stance: "SUPPORTS",
            relevanceScore: 0.94,
            quote: "Robert Pattinson has been named the next James Bond, succeeding Daniel Craig. Amazon MGM Studios confirmed the casting for the upcoming 007 installment."
          }
        ],
        contradicting: [],
        neutral: [],
        explanation: "Official announcements from EON Productions and Amazon MGM Studios, corroborated by international syndicates including Reuters and The Guardian, confirm Robert Pattinson's casting as the 7th James Bond."
      }
    ];

    for (const s of seedScenarios) {
      let inv = await Investigation.findOne({ userId: analyst._id, originalInput: s.input });
      if (!inv) {
        inv = await Investigation.create({
          userId: analyst._id,
          originalInput: s.input,
          inputType: s.inputType,
          extractedClaims: [s.claim],
          status: 'completed',
          isPublic: true,
          shareId: `share_${Math.random().toString(36).substring(2, 10)}`
        });

        const report = await VerificationReport.create({
          investigationId: inv._id,
          userId: analyst._id,
          claimId: `CLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          claim: s.claim,
          verdict: s.verdict,
          confidence: s.confidence,
          evidenceSufficiency: s.sufficiency,
          explanation: s.explanation,
          supportingEvidence: s.supporting,
          contradictingEvidence: s.contradicting,
          neutralEvidence: s.neutral,
          limitations: [],
          isPublic: true,
          timeline: [
            { stage: 'submission_received', title: 'Submission Received', status: 'completed', durationMs: 120, detail: 'Sanitized and session initialized.' },
            { stage: 'claims_extracted', title: 'Claims Extracted', status: 'completed', durationMs: 180, detail: 'Linguistic segmentation isolated verifiable propositions.' },
            { stage: 'search_completed', title: 'Search Completed', status: 'completed', durationMs: 420, detail: 'Authoritative wire and registry records retrieved.' },
            { stage: 'sources_analysed', title: 'Sources Analysed', status: 'completed', durationMs: 210, detail: 'Stance scored and authority tiers calibrated.' },
            { stage: 'assessment_generated', title: 'Assessment Generated', status: 'completed', durationMs: 150, detail: 'Editorial dossier compiled and verified.' }
          ]
        });

        // Also save to library
        await SavedReport.create({
          userId: analyst._id,
          reportId: report._id,
          notes: `Verified benchmark investigation: ${s.verdict}`
        });

        console.log(`  ✓ Seeded Investigation & Report: "${s.claim.substring(0, 50)}..." [${s.verdict}]`);
      } else {
        console.log(`  ✓ Investigation already exists: "${s.claim.substring(0, 50)}..."`);
      }
    }

    // 4. Summarize Atlas Database Status
    console.log('\n--- 4. MongoDB Atlas Database Summary ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Active Database: "${mongoose.connection.name}"`);
    console.log(`Total Collections: ${collections.length}`);

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  • Collection [${col.name}]: ${count} document(s)`);
    }

    console.log('\n====================================================');
    console.log('   Atlas Initialization & Seeding Complete!        ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('Atlas Initialization Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

initializeAtlas();
