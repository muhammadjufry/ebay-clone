import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import {
  useContract,
  useNetwork,
  useNetworkMismatch,
  useMakeBid,
  useOffers,
  useMakeOffer,
  useBuyNow,
  MediaRenderer,
  useAddress,
  useListing,
  useAcceptDirectListingOffer,
} from '@thirdweb-dev/react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { ListingType, NATIVE_TOKENS } from '@thirdweb-dev/sdk';
import Countdown from 'react-countdown';
import network from '../../utils/network';
import { ethers } from 'ethers';

type Props = {};

function ListingPage({}: Props) {
  const router = useRouter();
  const address = useAddress();
  const { listingId } = router.query as { listingId: string };
  const [bidAmount, setBidAmount] = useState<string>('');
  const [, switchNetwork] = useNetwork();
  const networkMismatch = useNetworkMismatch();
  const [minimumNextBid, setMinimumNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    'marketplace'
  );

  const { mutate: makeBid } = useMakeBid(contract);
  const { data: offers } = useOffers(contract, listingId);
  const { mutate: buyNow } = useBuyNow(contract);
  const { mutate: makeOffer } = useMakeOffer(contract);

  const { data: listing, isLoading, error } = useListing(contract, listingId);

  const { mutate: acceptOffer } = useAcceptDirectListingOffer(contract);

  useEffect(() => {
    if (!listingId || !contract || !listing) return;

    if (listing.type === ListingType.Auction) {
      fetchMinNextBid();
    }
  }, [listingId, listing, contract]);

  const fetchMinNextBid = async () => {
    if (!listingId || !contract) return;

    const { displayValue, symbol } = await contract.auction.getMinimumNextBid(
      listingId
    );

    setMinimumNextBid({
      displayValue: displayValue,
      symbol: symbol,
    });
  };

  const formatPlaceholder = () => {
    if (!listing) return;

    if (listing.type === ListingType.Direct) {
      return 'Enter Offer Amount';
    }
    if (listing.type === ListingType.Auction) {
      return Number(minimumNextBid?.displayValue) === 0
        ? 'Enter Bid Amount'
        : `${minimumNextBid?.displayValue} ${minimumNextBid?.symbol} or more`;
    }
  };

  const buyNft = async () => {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!listingId || !contract || !listing) return;

    await buyNow(
      {
        id: listingId,
        buyAmount: 1,
        type: listing.type,
      },
      {
        onSuccess(data, variables, context) {
          console.log('SUCCESS: ', data, variables, context);
          router.replace('/');
        },
        onError(data, variables, context) {
          alert('ERROR: NFT could not be bought');
          console.log('ERROR: ', data, variables, context);
        },
      }
    );
  };

  const createBidOrOffer = async () => {
    try {
      if (networkMismatch) {
        switchNetwork && switchNetwork(network);
        return;
      }

      // Direct Listing
      if (listing?.type === ListingType.Direct) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmount).toString()
        ) {
          console.log('Buyout Price met, buying NFT...');
          buyNft();
          return;
        }
        console.log('Buyout price not met, making offer...');
        await makeOffer(
          {
            quantity: 1,
            listingId,
            pricePerToken: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert('Offer made successfully');
              console.log('SUCCESS: ', data, variables, context);
              setBidAmount('');
            },
            onError(data, variables, context) {
              alert('ERROR: Offer could not be made');
              console.log('ERROR: ', data, variables, context);
            },
          }
        );
      }
      // Auction Listing
      if (listing?.type === ListingType.Auction) {
        console.log('Making bid...');

        await makeBid(
          {
            listingId,
            bid: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert('Bid made successfully');
              console.log('SUCCESS: ', data, variables, context);
              setBidAmount('');
            },
            onError(data, variables, context) {
              alert('ERROR: Bid could not be made');
              console.log('ERROR: ', data, variables, context);
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="text-center animate-pulse text-blue-500">
          <p>Loading Item...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto p-2 flex flex-col lg:flex-row items-center justify-center md:items-start space-y-10 space-x-12 pr-10">
        <div className="p-10 border mx-auto lg:mx-0 w-full ml-4 md:max-w-lg">
          <MediaRenderer src={listing.asset.image} className="w-full" />
        </div>

        <section className="md:!mt-0 !pt-4 md:!pt-0 !ml-4 md:ml-8 flex-1 space-y-5 pb-20 lg:pb-0">
          <div>
            <h1 className="text-2xl font-bold mt-4 md:mt-0">
              {listing.asset.name}
            </h1>
            <p className="flex items-center space-x-2 mt-3 text-xs sm:text-base border rounded-full px-4 py-2 cursor-pointer w-fit ">
              <UserCircleIcon className="h-5" />
              <span className="font-bold">Seller: {listing.sellerAddress}</span>
            </p>
            <p className="text-gray-600 mt-4">{listing.asset.description}</p>
          </div>
          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-bold">Listing Type:</p>
            <p>
              {listing.type === ListingType.Direct
                ? 'Direct Listing'
                : 'Auction Listing'}
            </p>
            <p className="font-bold">Buy it now Price:</p>
            <p className="text-4xl font-bold">
              {listing.buyoutCurrencyValuePerToken.displayValue}{' '}
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>
            <button
              onClick={buyNft}
              className="bg-blue-600 font-bold col-start-2 mt-4 text-white rounded-full py-4 px-10 w-56 hover:drop-shadow-xl cursor-pointer transition-all duration-500"
            >
              Buy Now
            </button>
          </div>

          {listing.type === ListingType.Direct && offers && (
            <div className="grid grid-cols-2 gap-y-2">
              <p className="font-bold">Offers: </p>
              <p className="font-bold">
                {offers.length > 0 ? offers.length : 0}
              </p>

              {offers.map((offer) => {
                <>
                  <p className="flex items-center ml-5 text-sm italic">
                    <UserCircleIcon className="h-3 mr-2" />
                    {offer.offeror.slice(0, 5) +
                      '...' +
                      offer.offeror.slice(-5)}
                  </p>
                  <div>
                    <p
                      className="text-sm italic"
                      key={
                        offer.listingId +
                        offer.offeror +
                        offer.totalOfferAmount.toString()
                      }
                    >
                      {ethers.utils.formatEther(offer.totalOfferAmount)}{' '}
                      {NATIVE_TOKENS[network].symbol}
                    </p>
                    {listing.sellerAddress === address && (
                      <button
                        onClick={() => {
                          acceptOffer(
                            {
                              listingId,
                              addressOfOfferor: offer.offeror,
                            },
                            {
                              onSuccess(data, variables, context) {
                                alert('Offer accepted successfully!');
                                console.log(
                                  'SUCCESS: ',
                                  data,
                                  variables,
                                  context
                                );
                                router.replace('/');
                              },
                              onError(data, variables, context) {
                                alert('ERROR: Offer could not be accept');
                                console.log(
                                  'ERROR: ',
                                  data,
                                  variables,
                                  context
                                );
                              },
                            }
                          );
                        }}
                        className="p-2 w-32 bg-red-500/50 rounded-lg"
                      >
                        Accept Offer
                      </button>
                    )}
                  </div>
                </>;
              })}
            </div>
          )}

          <div className="grid grid-cols-2 space-y-2 items-center justify-end">
            <hr className="col-span-2" />
            <p className="col-span-2 font-bold">
              {listing.type === ListingType.Direct
                ? 'Make an Offer'
                : 'Bid on this Auction'}
            </p>
            {listing.type === ListingType.Auction && (
              <>
                <p>Current Minimum Bid:</p>
                <p className="font-bold">
                  {minimumNextBid?.displayValue} {minimumNextBid?.symbol}
                </p>

                <p>Time Remaining:</p>
                <Countdown
                  date={Number(listing.endTimeInEpochSeconds.toString()) * 1000}
                />
              </>
            )}
            <input
              type="text"
              placeholder={formatPlaceholder()}
              onChange={(e) => setBidAmount(e.target.value)}
              className="border p-2 rounded-lg mr-5"
            />
            <button
              onClick={createBidOrOffer}
              className="bg-red-600 font-bold text-white rounded-full py-4 px-10 w-56 hover:drop-shadow-xl cursor-pointer transition-all duration-500"
            >
              {listing.type === ListingType.Direct ? 'Offer' : 'Bid'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ListingPage;
