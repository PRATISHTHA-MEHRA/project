/* ============================================================
   BrightPath Coaching — Admin dummy data (static JS arrays)
   ============================================================ */
window.DB = (function () {

  const courses = [
    { id: "CR-01", name: "Class 9 Mathematics", category: "School", level: "Class 9", subject: "Mathematics", duration: "12 months", monthly: 1800, quarterly: 5100, semi: 9700, annual: 18500, status: "Active", desc: "Full CBSE Class 9 maths syllabus with weekly tests." },
    { id: "CR-02", name: "Class 10 Science", category: "School", level: "Class 10", subject: "Science", duration: "12 months", monthly: 2200, quarterly: 6300, semi: 12000, annual: 23000, status: "Active", desc: "Physics, Chemistry & Biology for board preparation." },
    { id: "CR-03", name: "Class 11 Physics", category: "School", level: "Class 11", subject: "Physics", duration: "12 months", monthly: 2600, quarterly: 7400, semi: 14200, annual: 27000, status: "Active", desc: "Conceptual + numerical physics for Class 11." },
    { id: "CR-04", name: "Class 12 Chemistry", category: "School", level: "Class 12", subject: "Chemistry", duration: "12 months", monthly: 2800, quarterly: 8000, semi: 15300, annual: 29000, status: "Active", desc: "Organic, inorganic & physical chemistry, board focused." },
    { id: "CR-05", name: "JEE Foundation", category: "Competitive", level: "Class 11-12", subject: "PCM", duration: "24 months", monthly: 4500, quarterly: 12900, semi: 24800, annual: 47000, status: "Active", desc: "Two-year integrated JEE Main + Advanced program." },
    { id: "CR-06", name: "NEET Biology", category: "Competitive", level: "Class 11-12", subject: "Biology", duration: "24 months", monthly: 3800, quarterly: 10800, semi: 20700, annual: 39500, status: "Active", desc: "Botany & Zoology for NEET aspirants." },
    { id: "CR-07", name: "Spoken English", category: "Skill", level: "All", subject: "English", duration: "3 months", monthly: 1500, quarterly: 4200, semi: 8000, annual: 15000, status: "Active", desc: "Conversational fluency & personality development." },
    { id: "CR-08", name: "Computer Basics", category: "Skill", level: "All", subject: "Computers", duration: "4 months", monthly: 1200, quarterly: 3400, semi: 6500, annual: 12000, status: "Inactive", desc: "MS Office, internet & typing fundamentals." }
  ];

  const teachers = [
    { id: "TCH-01", name: "Rajesh Verma", mobile: "98201 44521", email: "rajesh.verma@brightpath.in", subjects: ["Mathematics"], qual: "M.Sc, B.Ed", exp: "12 yrs", batches: 3, payType: "Fixed Monthly Salary", joined: "2018-06-12", status: "Active", salary: 52000 },
    { id: "TCH-02", name: "Sunita Iyer", mobile: "99300 78812", email: "sunita.iyer@brightpath.in", subjects: ["Physics"], qual: "M.Sc Physics", exp: "9 yrs", batches: 2, payType: "Per Class Payment", joined: "2019-04-01", status: "Active", rate: 650 },
    { id: "TCH-03", name: "Arvind Nair", mobile: "98765 33210", email: "arvind.nair@brightpath.in", subjects: ["Chemistry"], qual: "Ph.D Chemistry", exp: "15 yrs", batches: 2, payType: "Revenue Share Percentage", joined: "2016-08-20", status: "Active", share: 35 },
    { id: "TCH-04", name: "Meera Joshi", mobile: "90041 22018", email: "meera.joshi@brightpath.in", subjects: ["Biology"], qual: "M.Sc Botany", exp: "7 yrs", batches: 2, payType: "Per Student Payment", joined: "2020-07-15", status: "Active", rateStu: 450 },
    { id: "TCH-05", name: "Deepak Sharma", mobile: "98119 65430", email: "deepak.sharma@brightpath.in", subjects: ["Mathematics", "Physics"], qual: "B.Tech, M.Sc", exp: "10 yrs", batches: 3, payType: "Hybrid Fixed + Per Class", joined: "2017-11-03", status: "Active", salary: 30000, rate: 400 },
    { id: "TCH-06", name: "Kavita Reddy", mobile: "97400 11290", email: "kavita.reddy@brightpath.in", subjects: ["English"], qual: "M.A English", exp: "6 yrs", batches: 1, payType: "Fixed Monthly Salary", joined: "2021-01-10", status: "Active", salary: 34000 },
    { id: "TCH-07", name: "Imran Sheikh", mobile: "98330 55674", email: "imran.sheikh@brightpath.in", subjects: ["Computers"], qual: "MCA", exp: "5 yrs", batches: 1, payType: "Per Class Payment", joined: "2022-03-22", status: "On Leave", rate: 500 },
    { id: "TCH-08", name: "Pooja Bansal", mobile: "99876 43321", email: "pooja.bansal@brightpath.in", subjects: ["Chemistry", "Biology"], qual: "M.Sc", exp: "8 yrs", batches: 2, payType: "Fixed Monthly Salary", joined: "2019-09-05", status: "Active", salary: 46000 }
  ];

  const classrooms = ["Room A1", "Room A2", "Room B1", "Room B2", "Lab-1", "Online"];

  const batches = [
    { id: "B-101", name: "X-Sci Morning", course: "Class 10 Science", subject: "Science", teacher: "Pooja Bansal", room: "Room A1", start: "2025-04-01", end: "2026-03-31", days: "Mon, Wed, Fri", st: "07:00 AM", et: "08:30 AM", max: 30, cur: 27, type: "Regular", status: "Active" },
    { id: "B-102", name: "IX-Math Eve", course: "Class 9 Mathematics", subject: "Mathematics", teacher: "Rajesh Verma", room: "Room A2", start: "2025-04-01", end: "2026-03-31", days: "Tue, Thu, Sat", st: "05:00 PM", et: "06:30 PM", max: 28, cur: 24, type: "Regular", status: "Active" },
    { id: "B-103", name: "XI-Phy Batch", course: "Class 11 Physics", subject: "Physics", teacher: "Sunita Iyer", room: "Room B1", start: "2025-04-01", end: "2026-03-31", days: "Mon, Wed, Fri", st: "04:00 PM", et: "05:30 PM", max: 25, cur: 22, type: "Regular", status: "Active" },
    { id: "B-104", name: "XII-Chem A", course: "Class 12 Chemistry", subject: "Chemistry", teacher: "Arvind Nair", room: "Room B2", start: "2025-04-01", end: "2026-03-31", days: "Tue, Thu, Sat", st: "06:30 AM", et: "08:00 AM", max: 24, cur: 21, type: "Regular", status: "Active" },
    { id: "B-105", name: "JEE-F 2025", course: "JEE Foundation", subject: "PCM", teacher: "Deepak Sharma", room: "Room A1", start: "2025-04-15", end: "2027-03-31", days: "Mon-Sat", st: "06:00 PM", et: "08:00 PM", max: 35, cur: 31, type: "Regular", status: "Active" },
    { id: "B-106", name: "NEET-Bio Wknd", course: "NEET Biology", subject: "Biology", teacher: "Meera Joshi", room: "Room B1", start: "2025-04-01", end: "2027-03-31", days: "Sat, Sun", st: "09:00 AM", et: "12:00 PM", max: 30, cur: 18, type: "Weekend", status: "Active" },
    { id: "B-107", name: "Eng-Speak C2", course: "Spoken English", subject: "English", teacher: "Kavita Reddy", room: "Online", start: "2025-05-01", end: "2025-07-31", days: "Mon, Wed", st: "07:00 PM", et: "08:00 PM", max: 20, cur: 14, type: "Online", status: "Active" },
    { id: "B-108", name: "XII-Chem Crash", course: "Class 12 Chemistry", subject: "Chemistry", teacher: "Pooja Bansal", room: "Room B2", start: "2026-01-05", end: "2026-03-15", days: "Mon-Fri", st: "10:00 AM", et: "12:00 PM", max: 20, cur: 0, type: "Crash Course", status: "Upcoming" },
    { id: "B-109", name: "Comp-Basics", course: "Computer Basics", subject: "Computers", teacher: "Imran Sheikh", room: "Lab-1", start: "2024-09-01", end: "2025-01-15", days: "Tue, Thu", st: "03:00 PM", et: "04:30 PM", max: 18, cur: 16, type: "Regular", status: "Completed" }
  ];

  const feeTypes = ["Monthly Fee", "Quarterly Fee", "Semi-Annual Fee", "Annual Fee"];
  const firstNames = ["Aarav","Diya","Vivaan","Ananya","Aditya","Ishita","Kabir","Saanvi","Reyansh","Myra","Arjun","Aadhya","Vihaan","Anika","Krishna","Navya","Sai","Pari","Dhruv","Riya","Aryan","Kiara","Rohan","Tara","Karan","Meera","Yash","Nisha","Veer","Sara"];
  const lastNames = ["Sharma","Verma","Patel","Gupta","Mehta","Reddy","Nair","Iyer","Joshi","Khan","Singh","Desai","Rao","Bose","Kulkarni","Chopra","Malhotra","Agarwal","Bhatt","Menon"];
  const sources = ["Walk-in","Referral","Google","Instagram","Facebook","Banner/Hoarding","Newspaper","School Tie-up"];
  const counselors = ["Neha Kapoor","Rohit Mehra","Anjali Das"];
  const statusFee = ["Paid","Pending","Overdue"];

  function rng(seed){ let s = seed; return () => (s = (s*9301+49297)%233280)/233280; }
  const rand = rng(77);
  const pick = a => a[Math.floor(rand()*a.length)];
  const ri = (a,b) => a + Math.floor(rand()*(b-a+1));

  const students = [];
  const classMap = { "Class 9 Mathematics":"Class 9","Class 10 Science":"Class 10","Class 11 Physics":"Class 11","Class 12 Chemistry":"Class 12","JEE Foundation":"Class 12","NEET Biology":"Class 12","Spoken English":"Class 10","Computer Basics":"Class 8" };
  for (let i = 0; i < 64; i++) {
    const b = batches[i % 7];
    const fn = pick(firstNames), ln = pick(lastNames);
    const ft = pick(feeTypes);
    const cobj = courses.find(c => c.name === b.course);
    const amt = ft === "Monthly Fee" ? cobj.monthly : ft === "Quarterly Fee" ? cobj.quarterly : ft === "Semi-Annual Fee" ? cobj.semi : cobj.annual;
    const fs = pick([...statusFee, "Paid", "Paid", "Pending"]);
    students.push({
      id: "STU-" + String(1001 + i),
      name: fn + " " + ln,
      mobile: "9" + ri(70,99) + ri(10000000,99999999),
      parent: pick(["Mr.","Mrs."]) + " " + pick(firstNames) + " " + ln,
      parentMobile: "9" + ri(70,99) + ri(10000000,99999999),
      cls: classMap[b.course] || "Class 10",
      course: b.course, batch: b.name, batchId: b.id,
      feeType: ft, feeAmt: amt,
      admission: `2025-0${ri(4,9)}-${String(ri(1,28)).padStart(2,'0')}`,
      status: rand() > 0.12 ? "Active" : "Inactive",
      feeStatus: fs,
      att: ri(68, 99),
      gender: pick(["M","F"]),
      dob: `20${ri(7,12)}-${String(ri(1,12)).padStart(2,'0')}-${String(ri(1,28)).padStart(2,'0')}`,
      address: `${ri(1,99)}, ${pick(["Andheri","Bandra","Powai","Dadar","Thane","Vashi"])}, Mumbai`,
      school: pick(["Delhi Public School","St. Xavier's","Ryan Intl.","Podar Intl.","Vibgyor High"])
    });
  }

  const enquiries = [];
  const enqStatus = ["New","Contacted","Demo Scheduled","Demo Completed","Interested","Converted","Lost"];
  for (let i=0;i<22;i++){
    const fn=pick(firstNames),ln=pick(lastNames);
    enquiries.push({
      id:"ENQ-"+String(501+i), name:fn+" "+ln, parent:pick(["Mr.","Mrs."])+" "+ln,
      mobile:"9"+ri(70,99)+ri(10000000,99999999), cls:pick(["Class 8","Class 9","Class 10","Class 11","Class 12"]),
      course:pick(courses).name, source:pick(sources), timing:pick(["Morning","Afternoon","Evening"]),
      followup:`2026-06-${String(ri(8,28)).padStart(2,'0')}`, counselor:pick(counselors),
      status:pick(enqStatus), remarks:pick(["Wants weekend batch","Comparing fees","Will visit centre","Asked for demo","Parent to confirm","Budget concern"]),
      date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`
    });
  }

  const demos = [];
  for (let i=0;i<12;i++){
    const e = enquiries[i];
    demos.push({
      id:"DM-"+String(301+i), student:e.name, course:e.course, batch:pick(batches).name,
      teacher:pick(teachers).name, date:`2026-06-${String(ri(8,25)).padStart(2,'0')}`,
      time:pick(["10:00 AM","04:00 PM","05:30 PM","06:00 PM"]),
      status:pick(["Scheduled","Completed","Completed","Cancelled","No Show"]),
      feedback:pick(["Liked the session","Will join","Needs follow-up","Found it tough","Excellent response","-"])
    });
  }

  // fees collected
  const fees = [];
  const modes = ["Cash","UPI","Bank Transfer","Card","Cheque"];
  const collectors = ["Neha Kapoor","Rohit Mehra","Front Desk"];
  for (let i=0;i<40;i++){
    const s = students[i];
    const disc = rand()>0.7? ri(1,5)*100 : 0;
    const fine = s.feeStatus==="Overdue" && rand()>0.6 ? 200 : 0;
    const paid = s.feeAmt - disc + fine;
    fees.push({
      id:"RCP-"+String(24001+i), student:s.name, studentId:s.id, batch:s.batch, feeType:s.feeType,
      period:pick(["Jun 2026","May 2026","Apr 2026","Q1 2026-27","H1 2026-27","2026-27"]),
      due:s.feeAmt, paid:paid, discount:disc, fine:fine, mode:pick(modes), txn:"TXN"+ri(100000,999999),
      collectedBy:pick(collectors), date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`,
      balance:0, remarks:pick(["","On-time payment","Paid at counter","Online payment",""])
    });
  }

  // pending fees
  const pending = [];
  const followStatus = ["Not Contacted","Reminder Sent","Promised","Disputed","Call Back"];
  students.filter(s=>s.feeStatus!=="Paid").slice(0,24).forEach((s,i)=>{
    const overdue = ri(2, 45);
    pending.push({
      id:"PF-"+String(701+i), student:s.name, studentId:s.id, parentMobile:s.parentMobile, batch:s.batch,
      feeType:s.feeType, period:pick(["Jun 2026","May 2026","Q1 2026-27"]), due:s.feeAmt,
      dueDate:`2026-0${ri(4,6)}-${String(ri(1,10)).padStart(2,'0')}`, overdue:overdue,
      lastReminder: rand()>0.4? `2026-06-${String(ri(1,7)).padStart(2,'0')}`:"—",
      follow:pick(followStatus), promise: rand()>0.6? `2026-06-${String(ri(10,28)).padStart(2,'0')}`:"—"
    });
  });

  // teacher payments
  const tpayments = teachers.map((t,i)=>{
    const assigned = ri(18,26), taken = assigned - ri(0,3), cancelled = assigned - taken;
    let gross;
    if (t.payType.includes("Fixed Monthly")) gross = t.salary;
    else if (t.payType.includes("Per Class")) gross = (t.rate||500)*taken;
    else if (t.payType.includes("Per Student")) gross = (t.rateStu||450)*ri(30,60);
    else if (t.payType.includes("Revenue Share")) gross = Math.round(ri(120000,200000)*(t.share/100));
    else gross = (t.salary||30000) + (t.rate||400)*ri(4,10);
    const ded = rand()>0.6? ri(1,5)*500 : 0;
    const adv = rand()>0.7? ri(2,6)*1000 : 0;
    const net = gross - ded - adv;
    const paid = rand()>0.5? net : (rand()>0.5? Math.round(net*0.5) : 0);
    const bal = net - paid;
    return {
      id:"TP-"+String(901+i), teacher:t.name, teacherId:t.id, month:"May 2026", payType:t.payType,
      assigned, taken, cancelled, students:ri(30,90), collection:ri(80000,260000),
      gross, ded, adv, net, paid, balance:bal,
      status: bal===0? "Paid" : paid===0? "Pending" : "Partially Paid"
    };
  });

  // income & expense
  const income = [];
  const incCats = ["Monthly Fees","Quarterly Fees","Semi-Annual Fees","Annual Fees","Admission Fees","Study Material Sales","Test Series Fees","Other Income"];
  for(let i=0;i<14;i++){
    income.push({ id:"INC-"+String(1101+i), date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`,
      category:pick(incCats), desc:pick(["Fee collection batch B-101","Admission Aarav S.","Material sales","Test series JEE","Misc receipt","Quarterly dues"]),
      mode:pick(modes), amount:ri(3,90)*1000 });
  }
  const expense = [];
  const expCats = ["Rent","Electricity","Internet","Staff Salary","Teacher Salary","Marketing","Stationery","Furniture","Software","Maintenance","Miscellaneous"];
  for(let i=0;i<16;i++){
    expense.push({ id:"EXP-"+String(1201+i), date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`,
      category:pick(expCats), desc:pick(["Centre rent June","MSEB bill","Broadband","Staff salary","Teacher payout","Google Ads","Printer paper","AMC service","Software license","Whiteboards"]),
      vendor:pick(["Landlord","MSEB","ACT Fibernet","Internal","Google","Office Mart","TechCare","Adobe"]),
      mode:pick(modes), amount:ri(2,80)*1000 });
  }

  // exams + marks
  const exams = [];
  for(let i=0;i<14;i++){
    const b=batches[i%7]; const tot=pick([50,80,100]);
    exams.push({ id:"EX-"+String(2001+i), name:pick(["Unit Test","Monthly Test","Weekly Quiz","Mock Exam","Chapter Test","Mid-Term"])+" "+ri(1,6),
      course:b.course, batch:b.name, subject:b.subject, teacher:b.teacher,
      date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`, total:tot, pass:Math.round(tot*0.33),
      syllabus:pick(["Ch 1-3","Ch 4-6","Full syllabus","Trigonometry","Optics","Organic basics"]),
      status:pick(["Scheduled","Completed","Completed","Result Published"]) });
  }
  const marks = [];
  const grades=["A+","A","B+","B","C","D"];
  exams.filter(e=>e.status!=="Scheduled").slice(0,6).forEach(e=>{
    students.filter(s=>s.batch===e.batch).slice(0,8).forEach((s,idx)=>{
      const m=ri(Math.round(e.total*0.3), e.total);
      marks.push({ examId:e.id, exam:e.name, student:s.name, batch:e.batch, subject:e.subject,
        total:e.total, obtained:m, rank:idx+1, grade:grades[Math.min(5,Math.floor((1-m/e.total)*6))],
        remarks:pick(["Good","Needs improvement","Excellent","Average","Careless errors","Well prepared"]) });
    });
  });

  const homework = [];
  for(let i=0;i<16;i++){
    const b=batches[i%7];
    homework.push({ id:"HW-"+String(3001+i), batch:b.name, subject:b.subject, teacher:b.teacher,
      title:pick(["Practice Set","Worksheet","Assignment","Revision Notes","Problem Set"])+" "+ri(1,12),
      desc:pick(["Solve all problems","Complete chapter exercises","Prepare summary","Write & submit","Lab observations"]),
      due:`2026-06-${String(ri(8,28)).padStart(2,'0')}`, submitted:ri(10,25), pending:ri(0,8),
      status:pick(["Active","Active","Closed","Overdue"]) });
  }

  const studyMaterial = [];
  for(let i=0;i<10;i++){
    const b=batches[i%7];
    studyMaterial.push({ id:"SM-"+String(4001+i), title:pick(["Chapter Notes","Formula Sheet","Sample Paper","Reference PDF","Video Lecture"])+" "+ri(1,9),
      course:b.course, subject:b.subject, type:pick(["PDF","DOC","Video","Link"]),
      uploadedBy:b.teacher, date:`2026-0${ri(4,6)}-${String(ri(1,28)).padStart(2,'0')}`, size:pick(["1.2 MB","680 KB","4.5 MB","2.1 MB","12 MB"]), downloads:ri(8,120) });
  }

  // timetable - today
  const today = [
    { batch:"X-Sci Morning", id:"B-101", subject:"Science", teacher:"Pooja Bansal", room:"Room A1", st:"07:00 AM", et:"08:30 AM", students:27, status:"Completed" },
    { batch:"XII-Chem A", id:"B-104", subject:"Chemistry", teacher:"Arvind Nair", room:"Room B2", st:"06:30 AM", et:"08:00 AM", students:21, status:"Completed" },
    { batch:"NEET-Bio Wknd", id:"B-106", subject:"Biology", teacher:"Meera Joshi", room:"Room B1", st:"09:00 AM", et:"12:00 PM", students:18, status:"Scheduled" },
    { batch:"XI-Phy Batch", id:"B-103", subject:"Physics", teacher:"Sunita Iyer", room:"Room B1", st:"04:00 PM", et:"05:30 PM", students:22, status:"Scheduled" },
    { batch:"IX-Math Eve", id:"B-102", subject:"Mathematics", teacher:"Rajesh Verma", room:"Room A2", st:"05:00 PM", et:"06:30 PM", students:24, status:"Scheduled" },
    { batch:"JEE-F 2025", id:"B-105", subject:"PCM", teacher:"Deepak Sharma", room:"Room A1", st:"06:00 PM", et:"08:00 PM", students:31, status:"Scheduled" },
    { batch:"Eng-Speak C2", id:"B-107", subject:"English", teacher:"Kavita Reddy", room:"Online", st:"07:00 PM", et:"08:00 PM", students:14, status:"Teacher Absent" }
  ];

  const notifications = [
    { type:"fee", title:"Fee payment received", text:"₹6,300 collected from Diya Sharma (X-Sci)", time:"12 min ago", color:"green" },
    { type:"enquiry", title:"New enquiry", text:"Kabir Khan enquired about JEE Foundation", time:"40 min ago", color:"blue" },
    { type:"alert", title:"Teacher absent", text:"Kavita Reddy marked absent for Eng-Speak C2", time:"1 hr ago", color:"red" },
    { type:"demo", title:"Demo completed", text:"Demo for NEET Biology marked completed", time:"3 hrs ago", color:"violet" },
    { type:"fee", title:"Pending fee overdue", text:"4 students crossed 30 days overdue", time:"5 hrs ago", color:"amber" }
  ];

  // dashboard KPIs
  const activeStudents = students.filter(s=>s.status==="Active").length;
  const dash = {
    totalStudents: students.length, activeStudents,
    newAdmissions: 9, totalTeachers: teachers.length,
    activeBatches: batches.filter(b=>b.status==="Active").length,
    todayClasses: today.length,
    monthlyCollection: 842500, pendingFees: 186400,
    teacherPaymentsDue: tpayments.reduce((a,t)=>a+t.balance,0),
    monthlyIncome: 968000, monthlyExpenses: 612000,
    pendingEnquiries: enquiries.filter(e=>["New","Contacted","Interested"].includes(e.status)).length,
    attendancePct: 87
  };
  dash.netProfit = dash.monthlyIncome - dash.monthlyExpenses;

  const collectionTrend = [
    {m:"Dec",v:680},{m:"Jan",v:725},{m:"Feb",v:690},{m:"Mar",v:810},{m:"Apr",v:760},{m:"May",v:842}
  ];
  const pendingTrend = [
    {m:"Dec",v:210},{m:"Jan",v:185},{m:"Feb",v:230},{m:"Mar",v:160},{m:"Apr",v:198},{m:"May",v:186}
  ];
  const incomeExpense = [
    {m:"Dec",inc:760,exp:540},{m:"Jan",inc:820,exp:580},{m:"Feb",inc:740,exp:560},
    {m:"Mar",inc:910,exp:600},{m:"Apr",inc:880,exp:590},{m:"May",inc:968,exp:612}
  ];
  const batchCount = batches.filter(b=>b.cur>0).map(b=>({label:b.name, value:b.cur}));
  const courseRevenue = [
    {label:"JEE Foundation",value:1395000},{label:"Class 12 Chemistry",value:610000},
    {label:"NEET Biology",value:711000},{label:"Class 10 Science",value:594000},
    {label:"Class 11 Physics",value:572000},{label:"Class 9 Mathematics",value:432000}
  ];
  const teacherPayout = tpayments.map(t=>({label:t.teacher, value:t.net}));
  const admissionSource = [
    {label:"Referral",value:34,color:"#126e63"},{label:"Google",value:22,color:"#b9772b"},
    {label:"Instagram",value:18,color:"#2d6db5"},{label:"Walk-in",value:14,color:"#6a4bab"},
    {label:"Others",value:12,color:"#5a6473"}
  ];

  return {
    courses, teachers, classrooms, batches, students, enquiries, demos, fees, pending,
    tpayments, income, expense, exams, marks, homework, studyMaterial, today, notifications,
    feeTypes, modes, sources, counselors, enqStatus, dash,
    charts: { collectionTrend, pendingTrend, incomeExpense, batchCount, courseRevenue, teacherPayout, admissionSource }
  };
})();
