import{s as e}from"./index-BaaMeyFG.js";var t=`<!DOCTYPE html>\r
<html lang="en">\r
<head>\r
    <meta charset="UTF-8"/>\r
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\r
    <title>SmartManhole — Stats Monitor</title>\r
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet"/>\r
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>\r
\r
    <style>\r
        :root {\r
          --bg-base:    #0a0f14;\r
          --bg-panel:   #10161d;\r
          --bg-card:    #161f28;\r
          --border:     #222f3e;\r
          --cyan:       #00e5ff;\r
          --green:      #00e676;\r
          --amber:      #ffab00;\r
          --red:        #ff1744;\r
          --text-main:  #f0f4f8;\r
          --text-dim:   #8a9cae;\r
          --text-dark:  #4f6374;\r
        }\r
\r
        * { box-sizing: border-box; margin: 0; padding: 0; }\r
\r
        body {\r
          background: var(--bg-base);\r
          color: var(--text-main);\r
          font-family: 'Barlow', sans-serif;\r
          padding: 24px;\r
          line-height: 1.5;\r
        }\r
\r
        .container {\r
          max-width: 1200px;\r
          margin: 0 auto;\r
        }\r
\r
        /* ─── HEADER AREA ─── */\r
        header {\r
          display: flex;\r
          justify-content: space-between;\r
          align-items: center;\r
          padding-bottom: 20px;\r
          border-bottom: 2px solid var(--border);\r
          margin-bottom: 24px;\r
        }\r
\r
        .brand h1 {\r
          font-size: 24px;\r
          font-weight: 700;\r
          letter-spacing: -0.5px;\r
        }\r
        .brand h1 span { color: var(--cyan); }\r
        .brand p { font-size: 13px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }\r
\r
        .system-clock {\r
          text-align: right;\r
          font-family: 'JetBrains Mono', monospace;\r
          font-size: 12px;\r
          color: var(--text-dim);\r
        }\r
        .live-pulse {\r
          display: inline-block;\r
          width: 8px;\r
          height: 8px;\r
          background: var(--cyan);\r
          border-radius: 50%;\r
          margin-right: 6px;\r
          box-shadow: 0 0 8px var(--cyan);\r
        }\r
\r
        /* ─── GLOBAL SYSTEM STATUS STATS ─── */\r
        .summary-bar {\r
          display: grid;\r
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\r
          gap: 16px;\r
          margin-bottom: 32px;\r
        }\r
\r
        .summary-card {\r
          background: var(--bg-panel);\r
          border: 1px solid var(--border);\r
          border-radius: 6px;\r
          padding: 16px;\r
          display: flex;\r
          align-items: center;\r
          gap: 16px;\r
        }\r
        .summary-card i { font-size: 24px; color: var(--text-dark); }\r
        .summary-data h3 { font-size: 24px; line-height: 1.2; font-family: 'JetBrains Mono', monospace; }\r
        .summary-data p { font-size: 11px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 1px; }\r
\r
        /* Status colors for summaries */\r
        #stat-critical-count { color: var(--red); }\r
        #stat-warning-count { color: var(--amber); }\r
        #stat-healthy-count { color: var(--green); }\r
\r
        /* ─── SECTION TITLE ─── */\r
        .section-title {\r
          font-size: 14px;\r
          text-transform: uppercase;\r
          letter-spacing: 1.5px;\r
          color: var(--text-dim);\r
          margin-bottom: 16px;\r
          font-family: 'JetBrains Mono', monospace;\r
          display: flex;\r
          align-items: center;\r
          gap: 8px;\r
        }\r
\r
        /* ─── DYNAMIC NODE STATS GRID ─── */\r
        .nodes-grid {\r
          display: grid;\r
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));\r
          gap: 20px;\r
        }\r
\r
        .node-card {\r
          background: var(--bg-panel);\r
          border: 1px solid var(--border);\r
          border-radius: 8px;\r
          padding: 20px;\r
          position: relative;\r
          display: flex;\r
          flex-direction: column;\r
          gap: 16px;\r
        }\r
\r
        /* Risk strip indicator on the left edge */\r
        .node-card::before {\r
          content: '';\r
          position: absolute;\r
          top: 0; bottom: 0; left: 0;\r
          width: 4px;\r
          border-radius: 8px 0 0 8px;\r
        }\r
        .node-card.CRITICAL::before { background: var(--red); }\r
        .node-card.WARNING::before { background: var(--amber); }\r
        .node-card.NORMAL::before { background: var(--green); }\r
\r
        .node-header {\r
          display: flex;\r
          justify-content: space-between;\r
          align-items: flex-start;\r
        }\r
        .node-title h2 { font-size: 18px; font-weight: 700; color: var(--text-main); }\r
        .node-title p { font-size: 12px; color: var(--text-dim); margin-top: 2px; }\r
\r
        .risk-badge {\r
          font-family: 'JetBrains Mono', monospace;\r
          font-size: 11px;\r
          font-weight: 700;\r
          padding: 4px 10px;\r
          border-radius: 4px;\r
          text-transform: uppercase;\r
        }\r
        .CRITICAL .risk-badge { background: rgba(255,23,68,0.15); color: var(--red); border: 1px solid rgba(255,23,68,0.3); }\r
        .WARNING .risk-badge { background: rgba(255,171,0,0.15); color: var(--amber); border: 1px solid rgba(255,171,0,0.3); }\r
        .NORMAL .risk-badge { background: rgba(0,230,118,0.15); color: var(--green); border: 1px solid rgba(0,230,118,0.3); }\r
\r
        /* Stat Grid Inside Cards */\r
        .metric-group {\r
          display: grid;\r
          grid-template-columns: 1fr 1fr;\r
          gap: 12px;\r
        }\r
\r
        .metric-box {\r
          background: var(--bg-card);\r
          border: 1px solid var(--border);\r
          border-radius: 4px;\r
          padding: 12px;\r
        }\r
        .metric-label {\r
          font-size: 10px;\r
          color: var(--text-dim);\r
          text-transform: uppercase;\r
          letter-spacing: 0.5px;\r
          margin-bottom: 4px;\r
          display: flex;\r
          align-items: center;\r
          gap: 6px;\r
        }\r
        .metric-value {\r
          font-family: 'JetBrains Mono', monospace;\r
          font-size: 20px;\r
          font-weight: 700;\r
        }\r
        .metric-unit { font-size: 12px; color: var(--text-dark); font-weight: 400; margin-left: 2px; }\r
\r
        /* Hardware Actuator Triggers status indicators */\r
        .hardware-flags {\r
          display: flex;\r
          gap: 12px;\r
          border-top: 1px solid var(--border);\r
          padding-top: 12px;\r
          font-family: 'JetBrains Mono', monospace;\r
          font-size: 11px;\r
        }\r
        .flag { display: flex; align-items: center; gap: 6px; color: var(--text-dark); }\r
        .flag.active { color: var(--cyan); }\r
        .flag.active i { color: var(--cyan); }\r
\r
        #loading-message {\r
          grid-column: 1 / -1;\r
          text-align: center;\r
          padding: 40px;\r
          color: var(--text-dim);\r
          font-family: 'JetBrains Mono', monospace;\r
        }\r
    </style>\r
</head>\r
<body>\r
\r
<div class="container">\r
\r
    <header>\r
        <div class="brand">\r
            <h1>SmartManhole <span>AI</span></h1>\r
            <p>MUNICIPAL OPERATIONS MONITOR</p>\r
        </div>\r
        <div class="system-clock">\r
            <span class="live-pulse"></span>LIVE FEED: <span id="runtime-clock">Connecting...</span>\r
        </div>\r
    </header>\r
\r
    <section class="summary-bar">\r
        <div class="summary-card">\r
            <i class="fa-solid fa-network-wired"></i>\r
            <div class="summary-data">\r
                <h3 id="stat-total-nodes">0</h3>\r
                <p>Total Areas</p>\r
            </div>\r
        </div>\r
        <div class="summary-card">\r
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--red);"></i>\r
            <div class="summary-data">\r
                <h3 id="stat-critical-count">0</h3>\r
                <p>Critical Threats</p>\r
            </div>\r
        </div>\r
        <div class="summary-card">\r
            <i class="fa-solid fa-circle-exclamation" style="color: var(--amber);"></i>\r
            <div class="summary-data">\r
                <h3 id="stat-warning-count">0</h3>\r
                <p>Warning Areas</p>\r
            </div>\r
        </div>\r
        <div class="summary-card">\r
            <i class="fa-solid fa-circle-check" style="color: var(--green);"></i>\r
            <div class="summary-data">\r
                <h3 id="stat-healthy-count">0</h3>\r
                <p>Healthy Areas</p>\r
            </div>\r
        </div>\r
    </section>\r
\r
    <main>\r
        <div class="section-title">\r
            <i class="fa-solid fa-chart-simple"></i> Area Infrastructure Live Metrics\r
        </div>\r
        <div class="nodes-grid" id="nodes-container">\r
            <div id="loading-message">\r
                <i class="fa-solid fa-spinner fa-spin"></i> Fetching records from Firebase instance...\r
            </div>\r
        </div>\r
    </main>\r
\r
</div>\r
\r
<script>\r
    const FIREBASE_DB_URL = "https://smartmanhole-xyz-default-rtdb.firebaseio.com/smartmanhole/nodes.json";\r
\r
    async function streamTelemetry() {\r
        try {\r
            const response = await fetch(FIREBASE_DB_URL);\r
            if (!response.ok) throw new Error("Database offline or blocked request.");\r
\r
            const data = await response.json();\r
            if (!data) {\r
                document.getElementById('nodes-container').innerHTML = '<div id="loading-message">No active data profiles found in Firebase.</div>';\r
                return;\r
            }\r
\r
            // Reset summary tally arrays\r
            let totalNodes = 0;\r
            let criticalCount = 0;\r
            let warningCount = 0;\r
            let healthyCount = 0;\r
\r
            let htmlBuffer = "";\r
\r
            // Loop through each distinct node entry parsed from Firebase\r
            for (const nodeId in data) {\r
                const nodeProfile = data[nodeId];\r
                if (!nodeProfile.live) continue; // Check for live payload safety block\r
\r
                const live = nodeProfile.live;\r
                totalNodes++;\r
\r
                // Track operational statuses across structural zones\r
                const risk = (live.risk_level || "NORMAL").toUpperCase();\r
                if (risk === "CRITICAL") criticalCount++;\r
                else if (risk === "WARNING") warningCount++;\r
                else healthyCount++;\r
\r
                // Build metric layouts injecting semantic FontAwesome icons safely\r
                htmlBuffer += \`\r
                    <div class="node-card \${risk}">\r
                        <div class="node-header">\r
                            <div class="node-title">\r
                                <h2>\${live.node_id || nodeId}</h2>\r
                                <p><i class="fa-solid fa-location-dot"></i> \${live.location || "Unknown Coordinates"}</p>\r
                            </div>\r
                            <span class="risk-badge">\${risk}</span>\r
                        </div>\r
\r
                        <div class="metric-group">\r
                            <div class="metric-box">\r
                                <div class="metric-label"><i class="fa-solid fa-droplet"></i> Water Level</div>\r
                                <div class="metric-value">\${live.water_level_cm !== undefined ? live.water_level_cm : '--'}<span class="metric-unit">cm</span></div>\r
                            </div>\r
                            <div class="metric-box">\r
                                <div class="metric-label"><i class="fa-solid fa-ruler"></i> Gap Dist</div>\r
                                <div class="metric-value">\${live.water_distance !== undefined ? live.water_distance : '--'}<span class="metric-unit">cm</span></div>\r
                            </div>\r
                            <div class="metric-box">\r
                                <div class="metric-label"><i class="fa-solid fa-cloud-meatball"></i> Gas Reading</div>\r
                                <div class="metric-value">\${live.gas_raw !== undefined ? live.gas_raw : '--'}<span class="metric-unit">raw</span></div>\r
                            </div>\r
                            <div class="metric-box">\r
                                <div class="metric-label"><i class="fa-solid fa-shield-halved"></i> Gas Risk</div>\r
                                <div class="metric-value" style="font-size: 14px; text-transform: uppercase; color: \${live.gas_risk === 'CRITICAL' ? 'var(--red)' : live.gas_risk === 'WARNING' ? 'var(--amber)' : 'var(--green)'}">\${live.gas_risk || 'UNKNOWN'}</div>\r
                            </div>\r
                        </div>\r
\r
                        <div class="hardware-flags">\r
                            <div class="flag \${live.servo_open ? 'active' : ''}">\r
                                <i class="fa-solid \${live.servo_open ? 'fa-door-open' : 'fa-door-closed'}"></i> Valve Cover: \${live.servo_open ? 'OPEN' : 'CLOSED'}\r
                            </div>\r
                            <div class="flag \${live.fan_on ? 'active' : ''}">\r
                                <i class="fa-solid fa-fan \${live.fan_on ? 'fa-spin' : ''}"></i> Exhaust Fan: \${live.fan_on ? 'RUNNING' : 'IDLE'}\r
                            </div>\r
                        </div>\r
                    </div>\r
                \`;\r
            }\r
\r
            // Sync structural DOM components efficiently\r
            document.getElementById('nodes-container').innerHTML = htmlBuffer;\r
            document.getElementById('stat-total-nodes').innerText = totalNodes;\r
            document.getElementById('stat-critical-count').innerText = criticalCount;\r
            document.getElementById('stat-warning-count').innerText = warningCount;\r
            document.getElementById('stat-healthy-count').innerText = healthyCount;\r
\r
            // Set sync timing string\r
            document.getElementById('runtime-clock').innerText = new Date().toLocaleTimeString();\r
\r
        } catch (err) {\r
            console.error("Dashboard Poll Interrupted:", err);\r
            document.getElementById('runtime-clock').innerText = "DISCONNECTED";\r
        }\r
    }\r
\r
    // Initialize telemetry background looping every 3 seconds\r
    streamTelemetry();\r
    setInterval(streamTelemetry, 3000);\r
<\/script>\r
\r
</body>\r
</html>\r
`,n=e();function r(){return(0,n.jsx)(`iframe`,{className:`overview-frame`,title:`SmartManhole Firebase dashboard`,srcDoc:t})}export{r as default};