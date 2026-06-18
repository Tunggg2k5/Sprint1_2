# Dental Appointment Training

Project moi doc lap nam trong `dental-appointment-training`.

Project cu khong bi sua. Giao dien frontend duoc canh theo giao dien cu cua SmileCare, nhung ban training chi giu 2 phan:

- Guest: trang chu, dich vu, bac si, danh gia, tu van, login/register/forgot password.
- Patient: navbar benh nhan, dat lich, lich hen, ho so dieu tri, hoa don, thong bao, profile, doi mat khau.

## Run backend

```bash
cd dental-appointment-training/backend
npm install
npm run dev
```

Backend chay tai:

```text
http://localhost:4100
```

Backend dang dung MongoDB Atlas qua file `backend/.env`, database `das`, giong project goc. Project training chi doc va dung du lieu hien co tu database nay, khong co file seed rieng.

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

Frontend dung Vite proxy `/api` sang backend `http://127.0.0.1:4100`, de co the chay song song voi project goc.

## Data

Project nay dung truc tiep du lieu trong MongoDB Atlas database `das`. Khong chay seed va khong tao du lieu mau rieng de tranh lam thay doi database cua project goc.

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
