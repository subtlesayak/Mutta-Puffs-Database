export const guideDestinations = [
  {title:'Puff Trails', route:'trails/', localized:false, description:'Pick a city and follow a short route through the bakeries people saved.', label:'Browse trails'},
  {title:'Puff Roulette', route:'roulette/', localized:false, description:'Let chance pick a nearby puff shop for your next bakery stop.', label:'Draw a spot'},
  {title:'Puff Passport', route:'passport/', localized:false, description:'Save shops and stamp the bakeries you’ve visited in a private diary.', label:'Open your passport'},
  {title:'Puff Wrapped', route:'wrapped/', localized:false, description:'Share a year of puff visits, cities, and your most visited bakery.', label:'Make a recap'},
  {title:'Puff Leaderboard', route:'leaderboard/', localized:false, description:'See how the community scores a puff and which places qualify for the rankings.', label:'See the rankings'},
  {title:'Mutta Puff Index', route:'price-index/', localized:false, description:'Compare reported prices by city and month, with a sample size for each.', label:'Explore prices'},
  {title:'Verification missions', route:'missions/', localized:true, description:'Help check a map pin or identify a bakery from a first-hand visit.', label:'Find missions'},
  {title:'Puff Heritage', route:'heritage/', localized:false, description:'Trace the egg puff’s name, recipe and journey from Kerala to bakeries and kitchens abroad.', label:'Read the stories'},
] as const;

export type GuideRoute = typeof guideDestinations[number]['route'];
