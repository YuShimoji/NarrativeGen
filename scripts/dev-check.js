// Simple smoke check script for CI
// Requires Node.js 20+ (global fetch)

async function main(){
  const base = 'http://127.0.0.1:8080';
  const res1 = await fetch(base + '/health');
  if (!res1.ok){
    throw new Error(`Health check failed: ${res1.status}`);
  }
  const text1 = await res1.text();
  if (text1.trim() !== 'ok'){
    throw new Error(`Unexpected health response: ${text1}`);
  }

  const res2 = await fetch(base + '/');
  if (!res2.ok){
    throw new Error(`Root check failed: ${res2.status}`);
  }
  const text2 = await res2.text();
  if (!text2.includes('NarrativeGen smoke server')){
    throw new Error(`Unexpected root response: ${text2}`);
  }

  console.log('Smoke checks passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
