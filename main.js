// --- ระบบจัดการเปลี่ยนแท็บหน้าจอ ---
function switchTab(tabId, element, isHome = false) {
    // 1. ซ่อนเนื้อหาฝั่งขวาทุกตัว
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // 2. เอาสถานะ active ออกจากเมนูย่อยและปุ่มโฮมทั้งหมด
    document.getElementById('home-nav-btn').classList.remove('active');
    const subMenuItems = document.querySelectorAll('.sub-menu-item');
    subMenuItems.forEach(item => item.classList.remove('active'));
    
    // 3. เปิดแสดงผลหน้าต่างที่เราเลือก
    document.getElementById(tabId).classList.add('active');
    
    // 4. ตั้งค่าปุ่มควบคุมที่คลิกให้เป็น active
    element.classList.add('active');

    // 5. บนจอแคบ (มือถือ/แท็บเล็ตแนวตั้ง) ยุบเมนูหมวดที่เปิดค้างไว้ ให้เห็นเนื้อหาทันทีโดยไม่ต้องเลื่อนจอเพิ่ม
    if (window.matchMedia('(max-width: 900px)').matches) {
        document.querySelectorAll('.menu-category.expanded').forEach(cat => {
            cat.classList.remove('expanded');
        });
    }
}

// --- ฟังก์ชันสำหรับการลิงก์จากหน้า Dashboard การ์ดไปยังเครื่องมือต่าง ๆ ---
function navigateToTool(tabId, navId) {
    const navElement = document.getElementById(navId);
    if (navElement) {
        switchTab(tabId, navElement);
    }
}

// --- ฟังก์ชันเปิด/ปิดเมนูย่อยในแต่ละหมวด ด้วยการคลิก/แตะ ---
// ทำเพิ่มเพราะเดิมเมนูย่อยเปิดด้วย CSS :hover อย่างเดียว ซึ่งใช้ไม่ได้ดีบนมือถือ/แท็บเล็ต
// (จอสัมผัสไม่มี hover จริง บางเบราว์เซอร์ต้องแตะ 2 ครั้งกว่าจะเท่ากับคลิก)
function toggleCategory(headerElement) {
    const category = headerElement.closest('.menu-category');
    if (!category) return;

    const isExpanded = category.classList.contains('expanded');

    // ปิดหมวดอื่นๆ ที่เปิดค้างไว้ก่อน กันไม่ให้เมนูยาวเกินไปบนจอเล็ก
    document.querySelectorAll('.menu-category.expanded').forEach(cat => {
        if (cat !== category) cat.classList.remove('expanded');
    });

    category.classList.toggle('expanded', !isExpanded);
}