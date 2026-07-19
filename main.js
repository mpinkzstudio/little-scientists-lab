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
}

// --- ฟังก์ชันสำหรับการลิงก์จากหน้า Dashboard การ์ดไปยังเครื่องมือต่าง ๆ ---
function navigateToTool(tabId, navId) {
    const navElement = document.getElementById(navId);
    if (navElement) {
        switchTab(tabId, navElement);
    }
}
