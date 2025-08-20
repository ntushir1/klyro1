const { profilePrompts } = require('./promptTemplates.js');

function buildSystemPrompt(promptParts, customPrompt = '', googleSearchEnabled = true, careerProfile = null) {
    // Extract career profile values for function calls
    const experienceLevel = careerProfile?.experience || 'experienced';
    const role = careerProfile?.role === 'custom' ? careerProfile?.customRole : (careerProfile?.role || 'professional');
    const industry = careerProfile?.industry || 'technology';
    const programmingLanguage = careerProfile?.programmingLanguage || 'JavaScript';
    const experienceRange = careerProfile?.experience || '3-5 years';
    
    // Call the functions with proper parameters
    const intro = typeof promptParts.intro === 'function' 
        ? promptParts.intro(experienceLevel, role, industry, programmingLanguage)
        : promptParts.intro;
    
    const formatRequirements = typeof promptParts.formatRequirements === 'function'
        ? promptParts.formatRequirements(role, experienceRange)
        : promptParts.formatRequirements;
    
    const sections = [intro, '\n\n', formatRequirements];

    if (googleSearchEnabled) {
        sections.push('\n\n', promptParts.searchUsage);
    }

    sections.push('\n\n', promptParts.content, '\n\nUser-provided context\n-----\n', customPrompt, '\n-----\n\n', promptParts.outputInstructions);

    return sections.join('');
}

function getSystemPrompt(profile, customPrompt = '', googleSearchEnabled = true, careerProfile = null) {
    const promptParts = profilePrompts[profile] || profilePrompts.interview;
    let systemPrompt = buildSystemPrompt(promptParts, customPrompt, googleSearchEnabled, careerProfile);
    
    // Add career profile context if available
    if (careerProfile && (careerProfile.industry || careerProfile.role || careerProfile.experience)) {
        if (profile === 'interview') {
            // For interview mode, use the specialized interview context
            const interviewContext = buildInterviewContext(careerProfile);
            systemPrompt = interviewContext + '\n\n' + systemPrompt;
        } else {
            // For other modes, use the general career context
            const careerContext = buildCareerContext(careerProfile);
            systemPrompt = careerContext + '\n\n' + systemPrompt;
        }
    }
    
    return systemPrompt;
}

function buildCareerContext(careerProfile) {
    const contextParts = [];
    
    if (careerProfile.industry) {
        contextParts.push(`Industry: ${careerProfile.industry}`);
    }
    
    if (careerProfile.role) {
        const role = careerProfile.role === 'custom' ? careerProfile.customRole : careerProfile.role;
        if (role) {
            contextParts.push(`Role: ${role}`);
        }
    }
    
    if (careerProfile.experience) {
        contextParts.push(`Experience: ${careerProfile.experience}`);
    }
    
    if (careerProfile.programmingLanguage) {
        contextParts.push(`Programming Language: ${careerProfile.programmingLanguage}`);
    }
    
    if (contextParts.length > 0) {
        return `**USER CONTEXT:**\n${contextParts.join(' | ')}\n\nPlease tailor your responses to be relevant for someone in this professional context.`;
    }
    
    return '';
}

function buildInterviewContext(careerProfile) {
    if (!careerProfile || (!careerProfile.industry && !careerProfile.role && !careerProfile.experience)) {
        return '';
    }
    
    const industry = careerProfile.industry || 'your industry';
    const role = careerProfile.role === 'custom' ? careerProfile.customRole : (careerProfile.role || 'your role');
    const experience = careerProfile.experience || 'your experience level';
    const programmingLanguage = careerProfile.programmingLanguage || 'your preferred language';
    
    // Build role-specific interview instructions
    const roleInstructions = buildRoleSpecificInstructions(role, industry, experience, programmingLanguage);
    
    return `**INTERVIEW CONTEXT:**
You are currently interviewing for a ${role} position in the ${industry} industry with ${experience} of experience.${programmingLanguage ? ` Your preferred programming language is ${programmingLanguage}.` : ''}

**INTERVIEW INSTRUCTIONS:**
As your interview coach, I will now simulate a real interview scenario for this ${role} position. I will ask you questions that are specifically tailored for ${industry} industry interviews at the ${experience} level.

${roleInstructions}

**READY TO BEGIN INTERVIEW SIMULATION**
Please respond to my questions as if you are currently sitting in the interview room for this ${role} position.`;
}

function buildRoleSpecificInstructions(role, industry, experience, programmingLanguage) {
    const roleLower = role.toLowerCase();
    
    // Technical/Engineering Roles
    if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('programmer') || roleLower.includes('architect')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Use ${programmingLanguage} for any coding examples
6. Structure your responses using the frameworks I've provided
7. Always start with brute force for coding questions
8. Explain space/time complexity in detail
9. Use PlantUML for algorithm visualization
10. Include edge cases and error handling
11. Mention testing strategies (unit, integration, performance)`;
    }
    
    // Product Management Roles
    if (roleLower.includes('product') || roleLower.includes('pm') || roleLower.includes('manager') || roleLower.includes('owner')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on user impact and business metrics
6. Use frameworks like RICE, KANO, or HEART
7. Include stakeholder management approaches
8. Emphasize data-driven decision making
9. Show understanding of technical constraints
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Sales & Business Roles
    if (roleLower.includes('sales') || roleLower.includes('business') || roleLower.includes('account') || roleLower.includes('revenue')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Use SPIN or BANT frameworks
6. Include objection handling strategies
7. Show understanding of customer pain points
8. Demonstrate ROI and business value
9. Include follow-up and relationship building
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Consulting Roles
    if (roleLower.includes('consultant') || roleLower.includes('consulting') || roleLower.includes('advisor')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Use structured problem-solving frameworks
6. Include hypothesis-driven approaches
7. Show quantitative analysis skills
8. Demonstrate stakeholder communication
9. Include implementation and change management
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Research & Academic Roles
    if (roleLower.includes('research') || roleLower.includes('academic') || roleLower.includes('scientist') || roleLower.includes('analyst')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Emphasize methodology and rigor
6. Include literature review approaches
7. Show statistical analysis skills
8. Demonstrate peer review understanding
9. Include funding and resource planning
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Marketing Roles
    if (roleLower.includes('marketing') || roleLower.includes('brand') || roleLower.includes('growth') || roleLower.includes('content')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on customer journey and conversion metrics
6. Use frameworks like AIDA, AARRR, or 4Ps
7. Include data analytics and ROI measurement
8. Show understanding of digital marketing channels
9. Include campaign optimization strategies
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Design & UX Roles
    if (roleLower.includes('design') || roleLower.includes('ux') || roleLower.includes('ui') || roleLower.includes('creative')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on user-centered design principles
6. Use frameworks like Design Thinking or Double Diamond
7. Include user research and testing methodologies
8. Show understanding of accessibility and usability
9. Include design system and component thinking
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Operations & Project Management Roles
    if (roleLower.includes('operations') || roleLower.includes('project') || roleLower.includes('program') || roleLower.includes('delivery')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on process optimization and efficiency
6. Use frameworks like Agile, Scrum, or Lean
7. Include risk management and mitigation strategies
8. Show understanding of stakeholder management
9. Include metrics and KPIs for success
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Finance & Accounting Roles
    if (roleLower.includes('finance') || roleLower.includes('accounting') || roleLower.includes('financial') || roleLower.includes('treasury')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on financial analysis and reporting
6. Use frameworks like DCF, NPV, or IRR
7. Include compliance and regulatory knowledge
8. Show understanding of financial modeling
9. Include risk assessment and mitigation
10. Structure your responses using the frameworks I've provided`;
    }
    
    // HR & People Roles
    if (roleLower.includes('hr') || roleLower.includes('human') || roleLower.includes('people') || roleLower.includes('talent')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on employee experience and engagement
6. Use frameworks like OKRs, 360 feedback, or employee lifecycle
7. Include diversity, equity, and inclusion strategies
8. Show understanding of labor laws and compliance
9. Include performance management and development
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Legal & Compliance Roles
    if (roleLower.includes('legal') || roleLower.includes('compliance') || roleLower.includes('regulatory') || roleLower.includes('counsel')) {
        return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Focus on risk assessment and mitigation
6. Use frameworks like GRC or risk management
7. Include regulatory knowledge and updates
8. Show understanding of compliance monitoring
9. Include legal research and analysis
10. Structure your responses using the frameworks I've provided`;
    }
    
    // Default generic instructions for unknown roles
    return `When I ask you questions:
1. Answer as if you are in a real interview right now
2. Use specific examples from your experience level
3. Demonstrate knowledge relevant to ${industry} and ${role}
4. Show understanding of challenges at the ${experience} level
5. Use industry-standard frameworks and methodologies
6. Include quantitative metrics and outcomes
7. Show problem-solving and analytical skills
8. Demonstrate stakeholder communication
9. Include continuous learning and adaptation
10. Structure your responses using the frameworks I've provided`;
}

module.exports = {
    getSystemPrompt,
    buildCareerContext,
    buildInterviewContext,
    buildRoleSpecificInstructions,
};
