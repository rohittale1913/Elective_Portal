import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function rawInspect() {
  try {
    console.log(`🔌 Connecting to: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get the raw collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const count = await usersCollection.countDocuments();
    console.log(`📊 Total documents in 'users' collection: ${count}\n`);

    if (count === 0) {
      console.log('Checking other collections...\n');
      const collections = await db.listCollections().toArray();
      console.log('Available collections:');
      collections.forEach(c => console.log(`  - ${c.name}`));
    } else {
      // Get first 5 documents
      const docs = await usersCollection.find({}).limit(5).toArray();
      console.log('First 5 documents:\n');
      docs.forEach((doc, i) => {
        console.log(`━━━━━━ Document ${i + 1} ━━━━━━`);
        console.log(JSON.stringify(doc, null, 2));
        console.log('');
      });

      // Check section field specifically
      const withSection = await usersCollection.countDocuments({ section: { $exists: true, $ne: null, $ne: '' } });
      const withoutSection = await usersCollection.countDocuments({ $or: [{ section: { $exists: false } }, { section: null }, { section: '' }] });
      
      console.log('📊 Section field status:');
      console.log(`  - Documents WITH section: ${withSection}`);
      console.log(`  - Documents WITHOUT section: ${withoutSection}`);
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

rawInspect();
