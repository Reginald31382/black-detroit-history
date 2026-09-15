# On This Day in Black Detroit History

## Workflow
1. Run `npm install`.
2. Set `MONGODB_URI` in `.env`.
3. Run `npm run seed` to load the 98-record working archive.
4. Open `/admin`.
5. Filter by month, day, year, and verification status.
6. Review records and add/confirm images.
7. Use **Approve for Instagram / Mark Used** only for approved records.
8. Used records move to the `/used` view by lifecycle status, but remain in MongoDB.

`src/data/detroit_black_history_seed_v1.json` is the working seed archive.
