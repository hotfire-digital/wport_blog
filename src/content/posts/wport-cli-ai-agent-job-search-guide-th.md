---
title: "คู่มือ WPORT CLI: ให้ AI Agent ค้นหางานและดึงข้อมูลตรงในเทอร์มินัล"
description: "ติดตั้ง @wport/cli ค้นหางาน WPORT ด้วยคำสั่งเดียว และส่งออก JSON ให้ Cursor กับ AI Agent อื่นประมวลผลต่อ รวมขั้นตอนติดตั้ง คำสั่งที่ใช้บ่อย พารามิเตอร์ที่เป็นมิตรกับ Agent และตัวอย่างจริง"
publishDate: 2026-07-07
tags: ["WPORT 功能", "AI 實作", "求職面試"]
featured: false
cover: "https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg"
---

<figure>
  <img src="https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg" alt="เดโมค้นหางาน WPORT CLI ในเทอร์มินัล" />
  <figcaption>WPORT CLI ให้ AI Agent ค้นหางานในเทอร์มินัลและส่งออกข้อมูลมีโครงสร้างได้</figcaption>
</figure>

เมื่อคุณบอก AI ใน Cursor ว่า “ช่วยหางาน PM ในเถาหยวน” มักจะได้แค่ search เว็บ หรือขอให้คุณก็อปวางเอง

ถ้าเราทำให้ **การค้นหางานเป็น CLI** AI Agent จะรันคำสั่งในเทอร์มินัล รับ JSON มีโครงสร้าง แล้วต่อยอดไปปรับเรซูเม่ จับคู่ JD หรือแม้แต่เขียนลงโน้ต Obsidian นั่นคือเหตุผลที่ [WPORT CLI](https://www.npmjs.com/package/@wport/cli) (`@wport/cli`) มีอยู่

---

## ทำไมเป็น CLI ไม่ใช่หน้าเว็บ?

UI เว็บเหมาะกับการคลิกของมนุษย์ **Command-line interface (CLI) เหมาะกับโปรแกรมและ AI Agent**

| สถานการณ์ | Web GUI | WPORT CLI |
|------|----------|-----------|
| มนุษย์เปิดดูงาน | ใช้งานง่าย สวย | ได้ แต่ไม่ใช่จุดหลัก |
| AI Agent ค้นอัตโนมัติ | ต้องจำลองคลิก ไม่เสถียร | คำสั่งเดียว เสถียร |
| ส่งต่อให้ Skill ขั้นถัดไป | ต้อง scrape HTML | JSON / NDJSON ดั้งเดิม |
| ใส่สคริปต์หรือ CI | ยาก | `pipe` เข้า `jq` |

WPORT CLI คืออินเทอร์เฟซเทอร์มินัลของ public API จาก W101 Talent Search Center การค้นและดูงานสาธารณะ **ไม่ต้องล็อกอิน** การจัดการงานฝั่งองค์กรมี subcommand `enterprise` แยก (ต้องมี API Key สรุปสั้นท้ายบท)

> **หมายเหตุเวอร์ชัน**: รุ่น npm ล่าสุดตอนนี้คือ `0.5.0` ยังอยู่ในช่วงพรีรีลีส `0.x` โดเมน API และคำสั่งอาจเปลี่ยน แนะนำล็อกหมายเลขเวอร์ชันในสคริปต์อัตโนมัติ

---

## ติดตั้ง

ต้องการ **Node.js >= 18.17**

```bash
npm install -g @wport/cli
```

ติดตั้งแล้ว พิมพ์ `wport` ในเทอร์มินัลได้เลย ถ้า AI Agent (เช่น Cursor Agent) มีสิทธิ์เทอร์มินัล ก็รันคำสั่งเหล่านี้แทนคุณได้เช่นกัน

ตรวจสภาพแวดล้อม:

```bash
wport doctor
```

`doctor` จะแสดง API base ที่ตั้งไว้ locale สถานะการเชื่อมต่อ และพฤติกรรม API ที่ Agent ควรระวัง (เช่น ฟิลด์เรียงลำดับถูกกำหนดโดยเซิร์ฟเวอร์ ฝั่งไคลเอนต์ override ไม่ได้)

---

## เริ่มเร็วสามขั้นตอน

### 1. ค้นหางาน

```bash
wport jobs search --keyword "產品經理"
```

ใส่รหัสพื้นที่เพื่อจำกัดผลลัพธ์ (รหัสพื้นที่ใช้ `-l` ซ้ำได้):

```bash
wport jobs search --keyword "PM" -l 6001001000
```

ค่าเริ่มต้นเทอร์มินัลจะแสดงเป็น **ตาราง** ถ้า output ถูก pipe จะสลับเป็น **JSON** อัตโนมัติเพื่อประมวลผลต่อ

### 2. ดูรายละเอียดงานเดียว

ก็อป `enc_id` จากผลการค้น แล้วรัน:

```bash
wport jobs view <enc_id>
```

จะดึงแค่ฟิลด์เดียวเพื่อลด token ที่ AI อ่านก็ได้:

```bash
wport jobs view <enc_id> --field job_info.job_title
```

### 3. ส่งออก JSON ให้ Agent หรือ jq

```bash
wport jobs search --keyword backend --output json
```

ถ้าต้องการเฉพาะฟิลด์ที่ Agent จำเป็น ใช้ `--minimal` (ชุดฟิลด์ย่อ):

```bash
wport jobs search --keyword backend --minimal --output json
```

หรือกำหนดฟิลด์เอง:

```bash
wport jobs search --keyword backend --fields enc_id,title --output json
```

`--minimal` กับ `--fields` จะตัด JSON ที่ฝั่ง **ไคลเอนต์** เพื่อให้ LLM อ่านฟิลด์ไม่เกี่ยวให้น้อยลง ปริมาณส่งผ่านเครือข่ายเท่าเดิม นี่ออกแบบมาเพื่อ workflow ของ Agent โดยเฉพาะ

---

## ตัวอย่างจริงสำหรับ AI Agent

### ตัวอย่าง A: ค้น → ดึง enc_id → อ่านชื่อแบบ batch

```bash
wport jobs search --keyword backend --fields enc_id --output json \
  | jq -r '.data[].enc_id' \
  | wport jobs view - --batch --field job_info.job_title
```

โหมด `--batch` อ่าน `enc_id` หลายค่าจาก stdin แล้วส่งออก NDJSON ทีละบรรทัด รายการเดียวล้มเหลวไม่หยุดทั้งชุด เหมาะกับ Agent ที่ประมวลผล JD หลายอันพร้อมกัน

### ตัวอย่าง B: ให้ Agent รันใน Cursor

ในโหมด Agent ของ Cursor คุณพูดได้ว่า:

> กรุณารัน `wport jobs search --keyword "桃園 產品經理" --minimal --output json` ในเทอร์มินัล จัดผลเป็นตาราง Markdown และทำเครื่องหมาย 3 รายการที่เหมาะกับบัณฑิตจบใหม่ที่สุด

Agent จะเรียก CLI ได้ JSON แล้วต่อด้วยคำแนะนำเรซูเม่ตาม Skill หรือบทสนทนาของคุณ เชื่อถือได้กว่าการขอให้ “ไปหาในเว็บไซต์”

### ตัวอย่าง C: คิวรีขั้นสูง (`--json-query`)

ตัวกรองบางอย่าง (อายุงาน โหมด remote ช่วงเงินเดือน ฯลฯ) ยังไม่เปิดเป็น flag สั้นๆ ให้เขียนเป็นไฟล์ JSON แล้วส่งเข้าไป:

```bash
wport jobs search --json-query ./my-search.json --output json
```

โครงสร้าง JSON ตรงกับ `JobSearchDto` ฝั่งเซิร์ฟเวอร์ เหมาะกับสคริปต์ขั้นสูง หรือ Agent ที่สร้างไฟล์คิวรีแบบไดนามิก

---

## ภาษาและการตั้งค่าส่วนตัว

สตริง UI ของ CLI คงที่ `--lang` มีผลกับ **ภาษาของเนื้อหาที่ API ส่งกลับ** (คำอธิบายงาน ฯลฯ):

```bash
wport jobs search --keyword backend --lang en-US
```

บันทึกค่าที่ต้องการแบบถาวร:

```bash
wport config set locale zh-TW
wport config get
```

รายการที่ตั้งได้: `locale`, `output`, `timeout_ms` ที่อยู่ API ให้ใช้ตัวแปรสภาพแวดล้อมหรือ flag อย่าเขียนลง config (เหตุผลด้านความปลอดภัย):

```bash
WPORT_API_BASE=https://api.wport.me wport jobs search --keyword backend
# หรือระบุครั้งเดียว
wport jobs search --keyword backend --api https://api.wport.me
```

---

## คำสั่งฝั่งองค์กร (ผู้สรรหา)

ถ้าคุณจัดการงาน WPORT ให้บริษัท ใช้ subcommand `wport enterprise` (ต้องมี API Key องค์กร `wpk_live_...` ติดต่อทีม BD เพื่อขอ):

```bash
wport enterprise login          # เก็บคีย์อย่างปลอดภัย (ไม่โผล่ใน shell history)
wport enterprise jobs list --status published
wport enterprise jobs create --file new-job.json
wport enterprise talents list --tab applied
```

คำสั่งองค์กร **แยกขาด** จาก `wport jobs` สาธารณะ ไม่ล็อกอินจะไม่แตะ API ฝั่งนายจ้าง CI / Agent ส่งคีย์ผ่านตัวแปรสภาพแวดล้อมก็ได้:

```bash
WPORT_API_KEY=wpk_live_... wport enterprise jobs list --minimal --output json
```

---

## Exit code และ rate limit

เมื่อ Agent เขียนสคริปต์ ใช้ exit code ตัดสินผล:

| Code | ความหมาย |
|------|------|
| `0` | สำเร็จ |
| `2` | อาร์กิวเมนต์ผิด |
| `3` | Server 4xx |
| `4` | Server 5xx / ข้อผิดพลาดเครือข่าย |
| `5` | Config เสียหาย |

Endpoint ค้นหางานสาธารณะจำกัดราว **1200 ครั้ง / นาที / IP** พอสำหรับการใช้งานโต้ตอบทั่วไปและ Agent สายเดี่ยว อย่าใช้ crawler หลายโปรเซสยิงจำนวนมาก

---

## ทำไมเราออกแบบแบบนี้

1. **Agent first**: `--minimal`, `--fields`, `--batch` และค่าเริ่มต้น JSON ที่เป็นมิตรกับ pipe ช่วยให้ AI อ่านเสียงรบกวนน้อยลง ทำงานมากขึ้น
2. **สาธารณะกับองค์กรแยกกัน**: ผู้หางานใช้ `wport jobs` โดยไม่ต้องมีบัญชี ฟีเจอร์บริษัทอยู่ใน `enterprise` สิทธิ์คีย์ชัดเจน
3. **สคริปต์ได้**: ต่อกับ `jq` Skill และ toolchain MCP ทำให้ “ค้นหางาน” เป็นหนึ่งลิงก์ในท่อปรับเรซูเม่และติดตามการสมัคร

นี่ก็คือแกนเดโมที่ Charging Station Vol.3: คำสั่งเดียว `wport jobs search` งาน PM เถาหยวนเข้า workflow ของ Agent ทันที ถ้าพลาดคลาส บทความนี้คือคู่มือชดเชย

---

## ขั้นถัดไป

- **ติดตั้งแพ็กเกจ**: [npmjs.com/package/@wport/cli](https://www.npmjs.com/package/@wport/cli)
- **เจอปัญหา**: รัน `wport doctor` ก่อน ในช่วง `0.x` อีเมล [yao@wport.me](mailto:yao@wport.me)
- **หางานบนเว็บ**: [wport.me](https://wport.me/)

เราจะอัปเดตโซน “WPORT features” ต่อเนื่องด้วยคำสั่งใหม่ ตัวอย่างเชื่อม Agent และข้อแลกเปลี่ยนการออกแบบผลิตภัณฑ์ บันทึกบทความนี้ไว้ ครั้งหน้าเปิด Cursor แล้วเรียก Agent รัน `wport` ได้เลย
