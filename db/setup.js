export const initializeCollections = async (db) => {
  const collections = ['items', 'locations'];

  const existing = await db.listCollections(
    {},
    { nameOnly: true }
  ).toArray();

  const existingNames = new Set(
    existing.map(collection => collection.name)
  );

  for (const name of collections) {
    if (!existingNames.has(name)) {
      await db.createCollection(name);
      console.log(`Created collection: ${name}`);
    }
  }

  console.log('Database collections initialized.');
};