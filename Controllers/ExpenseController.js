const UserModel = require("../Models/User");

const addTransaction = async (req, res) => {
    const { _id } = req.user;
    try {
        const { text, amount, type, category } = req.body;
        if (!text || !amount || !type) {
            return res.status(400).json({ message: "text, amount, and type are required", success: false });
        }
        const userData = await UserModel.findByIdAndUpdate(
            _id,
            { $push: { expenses: { text, amount, type, category: category || 'Other' } } },
            { new: true }
        );
        res.status(200).json({
            message: "Transaction added successfully",
            success: true,
            data: userData?.expenses
        });
    } catch (err) {
        return res.status(500).json({ message: "Something went wrong", error: err, success: false });
    }
};

const getAllTransactions = async (req, res) => {
    const { _id } = req.user;
    try {
        const userData = await UserModel.findById(_id).select('expenses name email');
        res.status(200).json({
            message: "Fetched transactions successfully",
            success: true,
            data: userData?.expenses,
            user: { name: userData?.name, email: userData?.email }
        });
    } catch (err) {
        return res.status(500).json({ message: "Something went wrong", error: err, success: false });
    }
};

const deleteTransaction = async (req, res) => {
    const { _id } = req.user;
    const expenseId = req.params.expenseId;
    try {
        const userData = await UserModel.findByIdAndUpdate(
            _id,
            { $pull: { expenses: { _id: expenseId } } },
            { new: true }
        );
        res.status(200).json({
            message: "Transaction deleted successfully",
            success: true,
            data: userData?.expenses
        });
    } catch (err) {
        return res.status(500).json({ message: "Something went wrong", error: err, success: false });
    }
};

module.exports = { addTransaction, getAllTransactions, deleteTransaction };
