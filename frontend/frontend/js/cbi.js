async function loadCBI() {

  try {

    console.log("Fetching CBI for:", userAddress);

    const user = await contract.getUser(userAddress);

    console.log("Raw user object:", user);

    const score = user.cbiScore.toNumber();

    document.getElementById("scoreValue").innerText = score;

    document.getElementById("scoreCategory").innerText =
      score >= 80 ? "Excellent" :
      score >= 70 ? "Good" :
      score >= 60 ? "Moderate" :
      "Needs Improvement";

  } catch (error) {
    console.error("CBI fetch error:", error);
  }
}

loadCBI();
