# Dental Appointment Training

Project moi doc lap nam trong `dental-appointment-training`.

Project cu khong bi sua. Giao dien frontend duoc canh theo giao dien cu cua SmileCare, nhung ban training chi giu 2 phan:

- Guest: trang chu, dich vu, bac si, danh gia, tu van, login/register/forgot password.
- Patient: navbar benh nhan, dat lich, lich hen, ho so dieu tri, hoa don, thong bao, profile, doi mat khau.

## Run backend

```bash
cd dental-appointment-training/backend
npm install
npm run seed
npm run dev
```

Backend chay tai:

```text
http://localhost:4100
```

## Run frontend

```bash
cd dental-appointment-training/frontend
npm install
npm run dev
```

Frontend chay tai:

```text
http://localhost:5174
```

Frontend dung Vite proxy `/api` sang backend `http://localhost:4100`.

## Demo account

```text
Phone: 0911000001
Password: Password123!
Role: patient
```

## Seed data

`npm run seed` tao lai bo du lieu mau sach:

- 1 patient co the dang nhap.
- 1 thong bao chua doc.
- 3 bac si.
- 3 phong kham.
- 4 dich vu.
- Review hien thi o trang guest.
- Lich hen patient.
- Hoa don patient.
- Ho so dieu tri va ke hoach dieu tri.

## API flow

```text
React
-> Axios
-> Express Route
-> Controller
-> Service
-> Repository
-> MongoDB Native Driver
```
